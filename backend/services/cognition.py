import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("COGNITION_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

def get_answer(sign_text):
    prompt = f"""
You are an expert Sign Language Translator and Tutor. 
First, convert the choppy sign language input (gloss) into a correct, definitional English question. 
Second, answer that question in ONE short, simple sentence.

Examples of intent:
If input is "WHAT FOOD", the question is "What is food?"
If input is "WHAT ANIMAL", the question is "What is an animal?"

Input:
{sign_text}

Output format:
QUESTION: ...
ANSWER: ...
"""

    response = model.generate_content(prompt)
    return response.text