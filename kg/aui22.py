#!/usr/bin/env python3
import os
import asyncio
import argparse
import logging
from pathlib import Path
import json

import cognee
from cognee.modules.search.types import SearchType
from cognee.api.v1.visualize.visualize import visualize_graph

import litellm
litellm._turn_on_debug()

async def setup_neo4j(neo4j_uri, neo4j_user, neo4j_password, api_key):
    """Configure Neo4j connection."""
    # Set API key
    cognee.config.graph_db_provider = "neo4j"
    # cognee.config.graph_db_uri = neo4j_uri
    # cognee.config.graph_db_username = "neo4j"
    # cognee.config.graph_db_password = "neo4jneo4j"
    # cognee.config.embedding_dimensions = 768
    # cognee.config.default_summary_model = "gemma3:12b"
    # cognee.config.ollama_base_url = "http://192.168.1.3:11434/v1"
    # cognee.config.ollama_summary_model = "gemma3:12b"
    # cognee.config.default_embedding_model = "bge-m3:567m"
    # cognee.config.huggingface_tokenizer = "sentence-transformers/all-MiniLM-L6-v2"
    # cognee.config.embedding_endpoint = "http://192.168.1.3:11434/api/embeddings"
    # cognee.config.llm_provider = "ollama"
    
    # Reset state
    # await cognee.prune.prune_data()
    # await cognee.prune.prune_system(metadata=True)
    logging.info("Neo4j configuration complete")


async def process_markdown(folder_path):
    """Process all markdown files in folder."""
    md_files = list(Path(folder_path).glob('**/*.md')) + list(Path(folder_path).glob('**/*.mdx'))
    logging.info(f"Found {len(md_files)} markdown files")
    
    for file in md_files:
        logging.info(f"Processing {file.name}")
        await cognee.add(str(file))
    
    logging.info("All files added. Running cognify...")
    await cognee.cognify(graph_model=KnowledgeGraph)
    logging.info("Knowledge graph generation complete")


async def extract_insights(output_dir):
    """Extract insights from the knowledge graph."""
    # Create entities list
    entities_query = "Extract and list all important entities mentioned in the documents"
    entities = await cognee.search(query_text=entities_query, query_type=SearchType.INSIGHTS)
    
    # Create concepts list
    concepts_query = "What are the key concepts and topics covered in these documents?"
    concepts = await cognee.search(query_text=concepts_query, query_type=SearchType.INSIGHTS)
    
    # Create relationships
    relationships_query = "What are the important relationships between entities in these documents?"
    relationships = await cognee.search(query_text=relationships_query, query_type=SearchType.INSIGHTS)
    
    # Save results
    results = {
        "entities": entities,
        "concepts": concepts, 
        "relationships": relationships
    }
    
    with open(os.path.join(output_dir, "insights.json"), "w") as f:
        json.dump(results, f, indent=2)

    logging.info("Insights extracted and saved")


async def main(folder_path, neo4j_uri, neo4j_user, neo4j_password, output_dir, api_key):
    """Main execution flow."""
    os.makedirs(output_dir, exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(output_dir, "kg_generation.log")),
            logging.StreamHandler()
        ]
    )
    
    try:
        # 1. Setup Neo4j
        await setup_neo4j(neo4j_uri, neo4j_user, neo4j_password, api_key)
        
        # 2. Process markdown files
        await process_markdown(folder_path)
        
        # 3. Extract insights
        # await extract_insights(output_dir)
        
        # 4. Generate visualization
        # vis_path = os.path.join(output_dir, "knowledge_graph.html")
        # await visualize_graph(vis_path)
        # logging.info(f"Visualization saved to {vis_path}")
        
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert markdown to Neo4j graph")
    parser.add_argument("folder", help="Folder containing markdown files")
    parser.add_argument("--neo4j-uri", default="bolt://localhost:7687", help="Neo4j URI")
    parser.add_argument("--neo4j-user", default="neo4j", help="Neo4j username")
    parser.add_argument("--neo4j-password", required=False, help="Neo4j password")
    parser.add_argument("--output-dir", default="./output", help="Output directory")
    parser.add_argument("--api-key", required=False, help="LLM API key")
    
    args = parser.parse_args()
    
    asyncio.run(main(
        args.folder,
        args.neo4j_uri,
        args.neo4j_user,
        args.neo4j_password,
        args.output_dir,
        args.api_key
    ))