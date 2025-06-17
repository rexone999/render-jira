import json
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

def search_similar(query, similarity_threshold=0.4, top_k=15):
    """Search for similar documents with similarity threshold filtering"""
    # Load latest paths
    with open('vector_db/latest_paths.json', 'r') as f:
        paths = json.load(f)
        index_path = paths['index_path']
        docs_path = paths['documents_path']
    
    # Load embedding model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Load index and documents
    index = faiss.read_index(index_path)
    with open(docs_path, 'rb') as f:
        documents = pickle.load(f)
    
    # Create query embedding
    query_embedding = model.encode([query])
    query_embedding = query_embedding.astype('float32')
    faiss.normalize_L2(query_embedding)
    
    # Search with higher top_k to get more candidates for filtering
    scores, indices = index.search(query_embedding, top_k)
    
    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < len(documents) and score >= similarity_threshold:
            result = documents[idx].copy()
            result['similarity_score'] = float(score)
            results.append(result)
    
    # Sort by similarity score (descending)
    results.sort(key=lambda x: x['similarity_score'], reverse=True)
    
    print(f"Found {len(results)} results above similarity threshold of {similarity_threshold}")
    return results

def search_tickets(query, similarity_threshold=0.4):
    """Search for tickets related to a query with similarity threshold"""
    try:
        results = search_similar(query, similarity_threshold=similarity_threshold)
        
        if not results:
            print(f"No tickets found with similarity above {similarity_threshold}")
            return []
        
        print(f"Query: '{query}'")
        print(f"Found {len(results)} related tickets/pages (similarity ≥ {similarity_threshold}):")
        print("="*70)
        
        for i, result in enumerate(results, 1):
            print(f"\n{i}. [{result['source'].upper()}] {result['title']}")
            print(f"   Similarity Score: {result['similarity_score']:.3f}")
            print(f"   URL: {result['url']}")
            
            if result['source'] == 'jira':
                metadata = result['metadata']
                print(f"   Status: {metadata['status']} | Priority: {metadata['priority']}")
                print(f"   Type: {metadata['issue_type']} | Assignee: {metadata['assignee']}")
            else:
                metadata = result['metadata']
                print(f"   Space: {metadata['space_name']}")
            
            # Show more text since we're not chunking
            preview_text = result['text'][:400] + "..." if len(result['text']) > 400 else result['text']
            print(f"   Content: {preview_text}")
            print("-" * 70)
        
        return results
            
    except Exception as e:
        print(f"Error searching: {e}")
        print("Make sure you have run vector_db_builder.py first to create the vector database.")
        return []

def search_with_fixed_threshold(query):
    """Search with fixed threshold of 0.4"""
    return search_tickets(query, similarity_threshold=0.4)

if __name__ == "__main__":
    print("JIRA/Confluence RAG Search")
    #print("Using fixed similarity threshold: 4")
    print("=" * 40)
    
    while True:
        query = input("\nEnter your search query (or 'quit' to exit): ").strip()
        if query.lower() in ['quit', 'exit', 'q']:
            break
        if query:
            results = search_with_fixed_threshold(query)
            print(f"\nReturned {len(results)} results")

