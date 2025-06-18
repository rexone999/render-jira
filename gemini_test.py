import os
from google import genai
from search_rag import search_with_fixed_threshold
import json
import requests
from requests.auth import HTTPBasicAuth
import sys

def load_api_key():
    """Load API key from API_KEY.txt"""
    try:
        with open('API_KEY.txt', 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        print("Error: API_KEY.txt file not found. Please create it with your Gemini API key.")
        return None

def initialize_gemini():
    """Initialize Gemini client"""
    api_key = load_api_key()
    if not api_key:
        return None
    
    return genai.Client(api_key=api_key)

def generate_search_queries(client, user_requirement):
    """Generate 1-2 search queries to find related tickets"""
    prompt = f"""
    Based on this user requirement for a new JIRA ticket:
    "{user_requirement}"
    
    Generate 1-2 specific search queries that would help find related existing tickets or documentation.
    These queries should focus on:
    - Similar features or functionality
    - Related technical components
    - Common issues or bugs in the same area
    
    Return only the search queries, sentence query (only 1 sentence) per line, without numbering or explanations.
    Maximum 2 queries.
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt]
        )
        queries = [q.strip() for q in response.text.strip().split('\n') if q.strip()]
        return queries[:2]  # Limit to 2 queries
    except Exception as e:
        print(f"Error generating search queries: {e}")
        return []

def search_related_tickets(queries):
    """Search for related tickets using the generated queries"""
    all_results = []
    
    for query in queries:
        results = search_with_fixed_threshold(query)
        all_results.extend(results)
    
    # Remove duplicates based on URL
    unique_results = []
    seen_urls = set()
    for result in all_results:
        if result['url'] not in seen_urls:
            unique_results.append(result)
            seen_urls.add(result['url'])
    
    return unique_results

def create_jira_ticket_content(client, user_requirement, related_tickets):
    """Generate JIRA ticket content based on requirement and related tickets"""
    
    # Prepare context from related tickets
    context = ""
    if related_tickets:
        context = "\n\nRELATED TICKETS FOUND:\n"
        for i, ticket in enumerate(related_tickets[:5], 1):  # Limit to top 5
            context += f"\n{i}. [{ticket['source'].upper()}] {ticket['title']}\n"
            context += f"   URL: {ticket['url']}\n"
            context += f"   Similarity: {ticket['similarity_score']:.3f}\n"
            
            if ticket['source'] == 'jira':
                metadata = ticket['metadata']
                context += f"   Status: {metadata['status']} | Priority: {metadata['priority']}\n"
                context += f"   Type: {metadata['issue_type']}\n"
            
            # Add brief content preview
            preview = ticket['text'][:200] + "..." if len(ticket['text']) > 200 else ticket['text']
            context += f"   Preview: {preview}\n"
    
    prompt = f"""
    Create a comprehensive JIRA ticket based on this requirement:
    "{user_requirement}"
    
    {context}
    
    Based on the related tickets above, create a detailed JIRA ticket that includes:
    
    1. **Title**: Clear, concise title for the ticket
    2. **Description**: Detailed description of what needs to be done(MAX:200 WORDS)
    3. **Acceptance Criteria**: Specific, testable criteria (use bullet points)(MAX:4 BULLETS)
    4. **Priority**: Suggest priority level (High/Medium/Low) with reasoning(ONE WORD)
    5. **Type**: Suggest ticket type (Story/Task/Bug/Epic)(ONE WORD)
    6. **Related Work**: Reference to similar tickets found (if any)(TICKET NO, TITLE AND DESCRIPTION)
    7. **Technical Considerations**: Any technical aspects based on related tickets(MAX:100 WORDS)
    
    Format the response clearly with proper sections and bullet points.
    If related tickets show similar work was done before, mention how this ticket differs or builds upon that work.
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt]
        )
        return response.text
    except Exception as e:
        print(f"Error generating JIRA ticket: {e}")
        return None

def process_requirement(requirement):
    """Process a single requirement and return the response"""
    # Initialize Gemini
    client = initialize_gemini()
    if not client:
        return "Error: Could not initialize Gemini client. Please check your API key."
    
    # Generate search queries
    queries = generate_search_queries(client, requirement)
    
    if not queries:
        return "Error: Could not generate search queries."
    
    # Search for related tickets
    related_tickets = search_related_tickets(queries)
    
    # Generate ticket content
    ticket_content = create_jira_ticket_content(client, requirement, related_tickets)
    
    if not ticket_content:
        return "Error: Could not generate ticket content."
    
    return ticket_content

def main():
    # Check if input is coming from stdin (API mode)
    if not sys.stdin.isatty():
        # Read input from stdin
        requirement = sys.stdin.read().strip()
        if requirement:
            response = process_requirement(requirement)
            print(response)
        return

    # Interactive mode
    print("🎯 JIRA Ticket Creator with AI Search")
    print("=" * 50)
    
    while True:
        requirement = input("\n📝 Enter your requirement for a new JIRA ticket (or 'quit' to exit): ").strip()
        
        if requirement.lower() in ['quit', 'exit', 'q']:
            break
            
        if not requirement:
            continue
        
        response = process_requirement(requirement)
        print("\n" + "="*80)
        print("🎟️  GENERATED JIRA TICKET")
        print("="*80)
        print(response)
        print("="*80)

if __name__ == "__main__":
    main()
