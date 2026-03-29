import os
from uuid import uuid4

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_session_messages, init_db, save_message

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

app = Flask(__name__)
CORS(app)
init_db()

SYSTEM_PROMPT = (
    "You are SmartStudy AI, a helpful academic assistant for computer science students. "
    "Always explain in a clear, structured way. "
    "Use simple language first, then a more technical explanation. "
    "When useful, include one practical example. "
    "Keep answers accurate, organized, and student-friendly."
)

TOPIC_GUIDANCE_MAP = {
    "Python": "Focus on Python syntax, concepts, beginner-friendly code examples, and practical usage.",
    "Databases": "Focus on database concepts, SQL, normalization, ER diagrams, keys, relationships, and practical examples.",
    "Algorithms": "Focus on algorithm logic, time complexity, space complexity, and step-by-step examples.",
    "Networking": "Focus on networking basics, protocols, IP addressing, DNS, routing, switching, and examples.",
    "Artificial Intelligence": "Focus on AI concepts, machine learning, neural networks, models, and easy explanations.",
    "Object-Oriented Programming": "Focus on classes, objects, inheritance, encapsulation, polymorphism, and code examples.",
}


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/session", methods=["POST"])
def create_session():
    session_id = str(uuid4())
    return jsonify({"session_id": session_id})


@app.route("/api/history/<session_id>", methods=["GET"])
def get_history(session_id: str):
    messages = get_session_messages(session_id)
    return jsonify({"messages": messages})


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    session_id = data.get("session_id")
    message = data.get("message", "").strip()
    topic = data.get("topic", "General Computer Science")

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400
    if not message:
        return jsonify({"error": "message is required"}), 400
    if not GROQ_API_KEY:
        return jsonify({"error": "Missing GROQ_API_KEY in backend environment"}), 500

    prior_messages = get_session_messages(session_id)

    conversation = [{"role": "system", "content": SYSTEM_PROMPT}]

    for item in prior_messages[-8:]:
        conversation.append(
            {
                "role": item["role"],
                "content": item["message"],
            }
        )

    topic_guidance = TOPIC_GUIDANCE_MAP.get(
        topic,
        "Focus on computer science concepts with simple explanations and one practical example.",
    )

    conversation.append(
        {
            "role": "user",
            "content": (
                f"Topic: {topic}\n"
                f"Guidance: {topic_guidance}\n"
                f"Question: {message}\n\n"
                "Please answer in this structure:\n"
                "1. Simple explanation\n"
                "2. Technical explanation\n"
                "3. One practical example"
            ),
        }
    )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": conversation,
        "temperature": 0.7,
    }

    try:
        response = requests.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60,
        )
    except requests.RequestException as error:
        print("Groq chat request exception:", error)
        return jsonify({"error": "Failed to connect to Groq API"}), 500

    if response.status_code != 200:
        print("Groq chat error:", response.status_code, response.text)
        return jsonify(
            {
                "error": f"LLM request failed ({response.status_code})",
                "details": response.text,
            }
        ), response.status_code

    result = response.json()
    reply = result["choices"][0]["message"]["content"]

    save_message(session_id, "user", message)
    save_message(session_id, "assistant", reply)

    return jsonify({"reply": reply})


@app.route("/api/quiz", methods=["POST"])
def quiz():
    data = request.get_json(force=True)
    topic = data.get("topic", "Python Basics")
    difficulty = data.get("difficulty", "Beginner")

    if not GROQ_API_KEY:
        return jsonify({"error": "Missing GROQ_API_KEY in backend environment"}), 500

    quiz_prompt = (
        f"Create 3 multiple-choice quiz questions for the topic '{topic}' at {difficulty} level. "
        "Return valid JSON in this exact format: "
        "{\"questions\":[{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":\"...\"}]}"
    )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You generate quiz content in valid JSON only.",
            },
            {
                "role": "user",
                "content": quiz_prompt,
            },
        ],
        "temperature": 0.4,
    }

    try:
        response = requests.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60,
        )
    except requests.RequestException as error:
        print("Groq quiz request exception:", error)
        return jsonify({"error": "Failed to connect to Groq API"}), 500

    if response.status_code != 200:
        print("Groq quiz error:", response.status_code, response.text)
        return jsonify(
            {
                "error": f"Quiz generation failed ({response.status_code})",
                "details": response.text,
            }
        ), response.status_code

    result = response.json()
    content = result["choices"][0]["message"]["content"]

    return jsonify({"quiz": content})


if __name__ == "__main__":
    app.run(debug=True, port=5000)