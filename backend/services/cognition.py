import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("COGNITION_KEY"))

model = genai.GenerativeModel("gemini-3-flash-preview")

def get_answer(sign_text):
    prompt = f"""
Convert the following sign language input into a correct English question.
Then answer it in ONE short, simple sentence.

Input:
{sign_text}

Output format:
QUESTION: ...
ANSWER: ...
"""

    response = model.generate_content(prompt)
    return response.text