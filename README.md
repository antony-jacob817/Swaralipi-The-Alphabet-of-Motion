# Swaralipi: The Alphabet of Motion 🤟

**Swaralipi** is an AI-powered educational platform designed to bridge the communication gap between the hearing-impaired community and the world. By leveraging advanced Machine Learning and Computer Vision, the platform translates Indian Sign Language (ISL) gloss into natural English and provides an interactive 2D avatar for immersive learning.
<img width="1845" height="815" alt="Screenshot 2026-05-12 094019" src="https://github.com/user-attachments/assets/5e99d3b9-c0e9-46f0-82d5-2b5248376a55" />

---

## 👥 Meet the Team

This project was developed with passion and dedication by:

* **Antony Jacob** - [GitHub](https://github.com/antony-jacob817)
* **Angela Mary Anil** - [GitHub](https://github.com/AngelaMaryAnil)
* **Alisha Ann Subash** - [GitHub](https://github.com/AlishaSubash)
* **Agnus Roy** - [GitHub](https://github.com/agnusr)

---

## ✨ Key Features

### 🧠 Intelligent Cognition

* **ISL to English Translation:** Converts choppy ISL gloss into grammatically correct English questions using the **Gemini 2.5 Flash API**.
* **Automated Answering:** Provides short, simple, and educational answers to student queries in real-time.
* **Gloss Conversion:** Translates English responses back into sign language gloss for the avatar to perform.

### 🎭 Interactive 2D Avatar

* **Motion Capture:** Uses **MediaPipe Holistic** to track body, face, and hand movements from video data.
* **Dynamic Animation:** A custom-built React component (`SignAvatar2D`) renders a stylized anime-character on an HTML5 Canvas.
* **Seamless Visualization:** Features 3D-style shading, gradients, and dynamic limb attachment for a natural, pleasing aesthetic.

### 📚 Educational Ecosystem

* **Teaching Mode:** Allows students to upload PDFs and learn chapters through sign language.
* **Doubt Resolution:** A specialized interface where students can sign their questions via webcam for AI-powered answers.
* **Dashboard & Progress:** Real-time tracking of study hours, points earned, and chapters completed for Students, Parents, and Admins.

---

# 🛠️ Tech Stack

## Frontend

* React.js with TypeScript
* Tailwind CSS (UI Styling)
* MediaPipe (Holistic Tracking)
* Vite (Build Tool)

## Backend

* Flask (Python Web Framework)
* TensorFlow / Keras (Sign Recognition)
* MongoDB Atlas (Cloud Database)
* Gemini 2.5 Flash API / Qwen (LLM Integration)

---

# 🚀 Installation & Setup

## 📋 Prerequisites

* Python 3.10
* Node.js & npm

---

# ⚙️ Backend Setup

1. Navigate to the `backend` folder.

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
```

3. Activate the virtual environment:

### Windows

```bash
.\venv\Scripts\activate
```

### Mac/Linux

```bash
source venv/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Create a `.env` file inside the backend folder:

```env
MONGO_URI=your_mongodb_uri
COGNITION_KEY=your_gemini_api_key
```

6. Run the Flask backend:

```bash
python app.py
```

---

# 🔐 Super Admin Setup

Swaralipi includes a secure multi-layer admin creation system to prevent unauthorized administrator access.

---

## 🛡️ Security Architecture

The platform uses the following security layers for admin account creation:

- `ADMIN_CREATION_SECRET` verification
- Existing Super Admin verification
- `SUPER_ADMIN_EMAILS` whitelist checking
- Password hashing using `bcrypt`

---

# 👑 Creating the First Super Admin

Since no admin exists during the initial setup, the first super admin must be created manually using the provided script:

```bash
python create_first_admin.py
```

## 📄 Required Environment Variables

Add the following variables inside your `.env` file:

```env
MONGO_URI=your_mongodb_uri
ADMIN_CREATION_SECRET=your_secure_random_secret_key
SUPER_ADMIN_EMAILS=admin1@school.com
COGNITION_KEY=your_gemini_api_key
```

---

## 🔑 Generating a Secure Admin Secret

You can generate a secure secret key using Python:

```python
import secrets
print(secrets.token_hex(32))
```

Example output:

```env
ADMIN_CREATION_SECRET=4d9f8a7c3e2b1f6a5d8c9e7f1234567890abcdef1234567890abcdef12345678
```

---

# ⚙️ How the Admin System Works

The `create_first_admin.py` script:

- Creates the initial admin account directly in MongoDB
- Marks the account as:
  - `role = admin`
  - `isSuperAdmin = True`
- Hashes passwords securely using `bcrypt`

The script does **NOT**:
- generate the `ADMIN_CREATION_SECRET`
- store the secret inside the admin account
- attach the secret to any database user

---

# 🔒 Admin Creation API Protection

After the first super admin is created, all future admin accounts must be created through the protected API endpoint:

```http
POST /api/admin/create-admin
```

This endpoint verifies:

1. Correct `ADMIN_CREATION_SECRET`
2. Requester is an existing super admin
3. Email permissions via `SUPER_ADMIN_EMAILS`

Example verification from `app.py`:

```python
if data['adminSecret'] != os.getenv('ADMIN_CREATION_SECRET'):
    return jsonify({'message': 'Invalid admin secret'}), 403
```

---

# ✅ Important Notes

- Existing admins do not store or “own” the secret key
- The backend compares incoming requests with the `.env` secret
- If the secret is lost, you can safely generate and replace it
- Changing the secret does not affect existing admin accounts

---

# 🚨 Recommended Security Practices

- Change the default password immediately after first login
- Never expose `ADMIN_CREATION_SECRET` publicly
- Use long randomly generated secrets
- Store secrets securely in environment variables only
- Avoid committing `.env` files to GitHub

---

# 💻 Frontend Setup

1. Navigate to the root directory.

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

---

# 🧠 Running Swaralipi Locally with Qwen

For our live production deployment on Render, we utilize the Gemini API because cloud-hosting a Large Language Model requires expensive GPU infrastructure.

However, Swaralipi was originally designed and tested using the **Qwen** model. If you are developing locally and want a completely free, offline, and private AI pipeline, you can easily swap out the Gemini API for a local Qwen instance.

---

## Step 1: Install Ollama

We use Ollama to run the Qwen model locally.

1. Download and install Ollama:

👉 `https://ollama.com/`

2. Open your terminal and pull the Qwen model by running:

```bash
ollama run qwen
```

> Note: This will download the model. Keep the terminal running or ensure the Ollama app is active in your system tray.

---

## Step 2: Swap the Cognition Service

By default, the backend uses:

```python
from services.cognition import get_answer
```

To use Qwen locally:

1. Navigate to:

```bash
backend
```

2. Open `app.py`

3. Replace:

```python
from services.cognition import get_answer
```

with:

```python
from services.cognition_qwen import get_answer
```

---

## Step 3: Run the Backend

You no longer need a `COGNITION_KEY` inside your `.env` file.

Simply run:

```bash
python app.py
```

Now all AI responses will be generated completely offline using your local Qwen model.

---

# 🌐 Deployment

## Frontend

Hosted on:

* `https://vercel.com`

## Backend

Hosted on:

* `https://render.com`

## Database

Hosted on:

* `https://mongodb.com/atlas`

---

# 📸 Project Highlights

✅ AI-powered ISL educational assistant
✅ Real-time sign-based doubt solving
✅ Interactive animated 2D avatar
✅ Offline local LLM support with Qwen
✅ PDF-based chapter teaching system
✅ Inclusive learning ecosystem for hearing-impaired students

---

# ❤️ Vision

Swaralipi aims to redefine inclusive education by combining Artificial Intelligence, Computer Vision, and Sign Language technology into one seamless educational experience.

The platform empowers hearing-impaired students to learn independently, communicate naturally, and interact with educational content in a more immersive and accessible way.

---

© 2026 Swaralipi Project Team. All Rights Reserved.
