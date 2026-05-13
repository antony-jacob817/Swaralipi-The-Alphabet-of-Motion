import requests
import traceback

def get_answer(sign_text):
    """
    Translates ISL gloss to English and generates an educational answer
    using a locally hosted Qwen model via Ollama.
    """
    
    prompt = f"""
    You are an expert Indian Sign Language (ISL) interpreter and a helpful teacher.
    A student has signed the following words (gloss): "{sign_text}"
    
    First, translate their signs into a natural, grammatically correct English question.
    Second, provide a short, simple, and educational answer to their question (maximum 3 sentences).
    
    You MUST format your output exactly like this:
    QUESTION: [The translated English question]
    ANSWER: [Your educational answer]
    """
    
    # Ollama's default local API endpoint
    ollama_url = "http://localhost:11434/api/generate"
    
    payload = {
        "model": "qwen",
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(ollama_url, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('response', '')
        else:
            print(f"Ollama API Error: {response.status_code} - {response.text}")
            return "QUESTION: Translation Error.\nANSWER: The local Qwen model returned an error."
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Ollama. Is it running?")
        return "QUESTION: Connection Error.\nANSWER: Please ensure Ollama is installed and running 'ollama run qwen' in your terminal."
    except Exception as e:
        print("❌ Error communicating with local Qwen:")
        traceback.print_exc()
        return f"QUESTION: Processing Error.\nANSWER: An unexpected error occurred: {str(e)}"