import json
import pandas as pd
import numpy as np
import faiss
import pickle
import os
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import re
from datetime import datetime

class VectorDBBuilder:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        """
        Initialize with sentence transformer model
        all-MiniLM-L6-v2 is lightweight and good for semantic search
        """
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
    def clean_text(self, text):
        """Clean and preprocess text"""
        if not text or pd.isna(text):
            return ""
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', str(text))
        # Remove special characters and normalize whitespace
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def process_jira_data(self, file_path, use_json=True):
        """Process JIRA tickets - each ticket as one document"""
        print("Processing JIRA data...")
        
        if use_json:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            df = pd.read_csv(file_path, encoding='utf-8')
            data = df.to_dict('records')
        
        documents = []
        
        for ticket in data:
            # Combine relevant fields for embedding
            title = ticket.get('summary', '')
            description = ticket.get('description', '')
            status = ticket.get('status', '')
            priority = ticket.get('priority', '')
            issue_type = ticket.get('issue_type', '')
            
            # Create full text - more structured for better embedding
            full_text = f"{title}\n\n{description}\n\nStatus: {status}\nPriority: {priority}\nType: {issue_type}"
            cleaned_text = self.clean_text(full_text)
            
            if cleaned_text.strip():  # Only add non-empty documents
                doc = {
                    'text': cleaned_text,
                    'source': 'jira',
                    'source_id': ticket.get('key', ticket.get('id', '')),
                    'title': title,
                    'url': ticket.get('url', ''),
                    'metadata': {
                        'status': status,
                        'priority': priority,
                        'issue_type': issue_type,
                        'assignee': ticket.get('assignee', ''),
                        'reporter': ticket.get('reporter', ''),
                        'created': ticket.get('created', ''),
                        'updated': ticket.get('updated', ''),
                        'labels': ticket.get('labels', []),
                        'components': ticket.get('components', [])
                    }
                }
                documents.append(doc)
        
        print(f"Created {len(documents)} JIRA documents")
        return documents
    
    def process_confluence_data(self, file_path, use_json=True):
        """Process Confluence pages - each page as one document"""
        print("Processing Confluence data...")
        
        if use_json:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            df = pd.read_csv(file_path, encoding='utf-8')
            data = df.to_dict('records')
        
        documents = []
        
        for page in data:
            title = page.get('title', '')
            content = page.get('content', '')
            space_name = page.get('space_name', '')
            
            # Create full text
            full_text = f"{title}\n\nSpace: {space_name}\n\n{content}"
            cleaned_text = self.clean_text(full_text)
            
            if cleaned_text.strip():  # Only add non-empty documents
                doc = {
                    'text': cleaned_text,
                    'source': 'confluence',
                    'source_id': page.get('id', ''),
                    'title': title,
                    'url': page.get('url', ''),
                    'metadata': {
                        'space_key': page.get('space_key', ''),
                        'space_name': space_name,
                        'version': page.get('version', ''),
                        'created': page.get('created', '')
                    }
                }
                documents.append(doc)
        
        print(f"Created {len(documents)} Confluence documents")
        return documents
    
    def create_vector_db(self, documents):
        """Create FAISS vector database"""
        print("Creating embeddings...")
        
        # Extract texts for embedding
        texts = [doc['text'] for doc in documents]
        
        # Create embeddings in batches to manage memory
        batch_size = 32
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = self.model.encode(batch, show_progress_bar=True)
            embeddings.extend(batch_embeddings)
        
        embeddings = np.array(embeddings).astype('float32')
        
        # Create FAISS index
        print("Building FAISS index...")
        index = faiss.IndexFlatIP(self.embedding_dim)  # Inner product for cosine similarity
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        index.add(embeddings)
        
        return index, embeddings
    
    def save_vector_db(self, index, documents, output_dir='vector_db'):
        """Save FAISS index and documents"""
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save FAISS index
        index_path = os.path.join(output_dir, f'faiss_index_{timestamp}.bin')
        faiss.write_index(index, index_path)
        
        # Save documents with metadata
        docs_path = os.path.join(output_dir, f'documents_{timestamp}.pkl')
        with open(docs_path, 'wb') as f:
            pickle.dump(documents, f)
        
        # Save latest paths for easy access
        with open(os.path.join(output_dir, 'latest_paths.json'), 'w') as f:
            json.dump({
                'index_path': index_path,
                'documents_path': docs_path,
                'timestamp': timestamp,
                'total_documents': len(documents)
            }, f, indent=2)
        
        print(f"Vector DB saved:")
        print(f"  Index: {index_path}")
        print(f"  Documents: {docs_path}")
        
        return index_path, docs_path

def main():
    # Configuration
    USE_JSON = True  # Set to False to use CSV
    DATA_DIR = 'data'
    
    # Find latest data files
    files = os.listdir(DATA_DIR)
    
    if USE_JSON:
        jira_files = [f for f in files if f.startswith('jira_tickets_') and f.endswith('.json')]
        confluence_files = [f for f in files if f.startswith('confluence_pages_') and f.endswith('.json')]
    else:
        jira_files = [f for f in files if f.startswith('jira_tickets_') and f.endswith('.csv')]
        confluence_files = [f for f in files if f.startswith('confluence_pages_') and f.endswith('.csv')]
    
    if not jira_files or not confluence_files:
        print("No data files found. Please run atlassian_extractor.py first.")
        return
    
    # Use latest files
    jira_file = os.path.join(DATA_DIR, sorted(jira_files)[-1])
    confluence_file = os.path.join(DATA_DIR, sorted(confluence_files)[-1])
    
    print(f"Using files:")
    print(f"  JIRA: {jira_file}")
    print(f"  Confluence: {confluence_file}")
    
    # Build vector database
    builder = VectorDBBuilder()
    
    # Process data
    jira_docs = builder.process_jira_data(jira_file, USE_JSON)
    confluence_docs = builder.process_confluence_data(confluence_file, USE_JSON)
    
    # Combine all documents
    all_documents = jira_docs + confluence_docs
    print(f"Total documents: {len(all_documents)}")
    
    # Create vector database
    index, embeddings = builder.create_vector_db(all_documents)
    
    # Save vector database
    index_path, docs_path = builder.save_vector_db(index, all_documents)
    
    print("\nVector database creation completed!")
    print(f"You can now use search_rag.py to query the database.")

if __name__ == "__main__":
    main()

