# 📌 Blog Search Backend

This is the backend for a blog search application with intelligent search capabilities powered by Retrieval-Augmented Generation (RAG) using Chroma vector database and Ollama LLM. Built with Node.js, Express, and Mongoose, it integrates JWT authentication, Cloudinary for image uploads, and a Python ETL pipeline for indexing blog posts into Chroma.

## 🚀 Technologies Used

- **Node.js**: JavaScript runtime for server-side logic.
- **Express**: Web framework for building RESTful APIs.
- **Mongoose**: ODM for MongoDB to manage data models (Post, Category, Tag, User).
- **Multer**: Middleware for handling file uploads (e.g., post images).
- **JWT**: JSON Web Token for user authentication.
- **Cloudinary**: Cloud service for storing and serving post images.
- **ChromaDB**: Vector database for storing and querying blog post embeddings.
- **Ollama**: Local LLM (LLaMA3) for generating natural language answers in RAG.
- **@xenova/transformers**: Embedding model for query vectorization.
- **LangChain**: Framework for building RAG pipeline.
- **Axios**: HTTP client for communicating with ETL API.
- **CORS**: Middleware for enabling cross-origin requests.

## 📂 Project Structure

```
backend/
├── config/                     # Configuration files (e.g., database connection)
├── controllers/                # API controllers for handling requests
├── middlewares/                # Middleware for authentication and other logic
├── models/                     # Mongoose schemas (Post, User, etc.)
├── node_modules/               # Auto-generated dependencies (ignored)
├── routes/                     # API route definitions
├── services/                   # Business logic (e.g., RAG search)
├── uploads/                    # Temporary storage for file uploads (ignored)
├── .env                        # Environment variables (ignored)
├── .gitignore                  # Git ignore file
├── README.md                   # Project documentation
├── app.js                      # Express app entry point
├── package-lock.json           # Lock file for dependencies
├── package.json                # Project metadata and dependencies
└── server.js                   # Alternative server entry point (if used)
```

## ⚙️ Setup and Installation

1. **Prerequisites** 🔧:

   - Node.js (v16 or higher)
   - MongoDB Atlas (accessible via `MONGODB_URI`)
   - Chroma server (running at `CHROMA_HOST:CHROMA_PORT`)
   - Ollama server (running at `OLLAMA_BASE_URL` with `OLLAMA_MODEL`)
   - Python ETL server (running at `ETL_API_URL`)
   - Cloudinary account for image uploads

2. **Install Dependencies** 📦:

   ```bash
   cd client
   npm install
   ```

3. **MongoDB Setup** 🗄️:
   - Connect to MongoDB Atlas using `MONGODB_URI`.
   - Example data for `blog_db.posts`:
     ```javascript
     use blog_db;
     db.posts.insertOne({
       uid: new ObjectId(),
       title: "Giới thiệu Hà Nội",
       slug: "gioi-thieu-ha-noi",
       description: "Thủ đô Việt Nam",
       content: "<p>Hà Nội là thủ đô của Việt Nam. Thành phố này có lịch sử hơn 1000 năm.</p>",
       imageUrl: "https://res.cloudinary.com/daeorkmlh/image/upload/...",
       category: new ObjectId(),
       tags: [],
       status: "published",
       views: 0,
       isDeleted: false
     });
     ```

## 🌍 Environment Variables

Create a `.env` file in the `client` directory with the following variables:

```env
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PORT=
CHROMA_HOST=
CHROMA_PORT=
CHROMA_SSL=
COLLECTION_NAME=
OLLAMA_BASE_URL=
OLLAMA_MODEL=
EMBED_MODEL=
ETL_API_URL=
```

- **MONGODB_URI**: MongoDB Atlas connection string (replace `<password>` with your password).
- **JWT_SECRET**: Secret key for signing JWT tokens.
- **CLOUDINARY_CLOUD_NAME**: Cloudinary cloud name for image storage.
- **CLOUDINARY_API_KEY**: Cloudinary API key.
- **CLOUDINARY_API_SECRET**: Cloudinary API secret.
- **PORT**: Port for the Express server.
- **CHROMA_HOST**: Chroma server hostname.
- **CHROMA_PORT**: Chroma server port.
- **CHROMA_SSL**: Enable SSL for Chroma (true/false).
- **COLLECTION_NAME**: Chroma collection name for blog post embeddings.
- **OLLAMA_BASE_URL**: Ollama server URL for LLM.
- **OLLAMA_MODEL**: Ollama model name (e.g., llama3).
- **EMBED_MODEL**: Sentence-Transformers model for embeddings.
- **ETL_API_URL**: Python ETL API endpoint for indexing posts.

## 🏃 Running the Application

1. **Start MongoDB Atlas** ☁️:

   - Ensure `MONGODB_URI` is accessible (configured in MongoDB Atlas).

2. **Start Chroma Server** 📊:

   ```bash
   cd ../chroma_server
   chroma run --path ./chroma-data --port 8000
   ```

3. **Start Ollama** 🤖:

   ```bash
   ollama run llama3
   ```

4. **Start ETL API** 🛠️:

   ```bash
   cd ../chroma_server
   python -m etl.main
   ```

5. **Start Backend** 🚀:

   ```bash
   cd server
   node server.js
   ```

   - Server runs at `http://localhost:3000`.

6. **Start Frontend** (optional) 🌐:
   ```bash
   cd ../client
   npm run dev
   ```

## 🔐 Authentication

- The backend uses JWT for authentication. Protected endpoints (e.g., `/api/posts`) require a Bearer token in the `Authorization` header.
- **Login**:
  - Endpoint: `POST /api/users/login`
  - Request:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
  - Response:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
- **Usage**: Include token in requests:
  ```bash
  curl -H "Authorization: Bearer <token>" http://localhost:3000/api/posts
  ```

## 🔍 API Endpoints Feature

### POST `/api/search`

- **Description**: Performs intelligent search using RAG (Retrieval-Augmented Generation).
- **Request Body**:
  ```json
  {
    "query": "Ẩm thực Hà Nội là gì?"
  }
  ```
- **Response**:
  ```json
  {
    "chunks": [
      {
        "content": "Phở là món ăn nổi tiếng ở Hà Nội.",
        "metadata": {
          "post_id": "123",
          "title": "Ẩm thực Hà Nội",
          "url": "/posts/am-thuc-ha-noi",
          "chunk_index": 0,
          "char_start": 0,
          "char_end": 50,
          "hash": "abc123..."
        }
      }
    ],
    "answer": "Phở là món ăn nổi tiếng nhất ở Hà Nội, thường được ăn vào bữa sáng."
  }
  ```

## 🛠️ ETL Integration

- The backend communicates with a Python ETL pipeline (running at `ETL_API_URL`).
- On post save (`Post.js` middleware), it sends post data to the ETL API for indexing into Chroma:
  - Action: `upsert` for published posts, `delete` for others.
- To re-run ETL for all posts:
  ```bash
  cd ../chroma_server
  python return_etl.py
  ```

## 🤖 RAG Search

- The `/api/search` endpoint uses a Retrieval-Augmented Generation (RAG) pipeline:
  1. **Embedding**: Query is embedded using `EMBED_MODEL` (Xenova/paraphrase-multilingual-MiniLM-L12-v2).
  2. **Retrieval**: Top-3 chunks are retrieved from Chroma (`COLLECTION_NAME`).
  3. **Generation**: Ollama (`OLLAMA_MODEL`) generates a natural language answer based on chunks.
- The response includes both chunks (for context) and the LLM-generated answer.

## 🐞 Debugging

- **MongoDB**: Verify `MONGODB_URI` connection with MongoDB Atlas (check Network Access/Database Access).
- **Chroma**: Check server status (`curl http://localhost:8000/api/v1/collections`).
- **Ollama**: Test LLM (`curl http://localhost:11434/api/generate -d '{"model":"llama3","prompt":"Test"}'`).
- **ETL API**: Test endpoint (`curl -X POST http://localhost:5001/etl/process -H "Content-Type: application/json" -d '{"action":"upsert","post":{"post_id":"123","title":"Test","slug":"test","content":"Hello"}}'`).
- **JWT**: Ensure valid token (`JWT_SECRET`) for protected routes.
- **Cloudinary**: Verify `CLOUDINARY_*` credentials for image uploads.
- **Logs**: Check console for errors in `server.js` or `etl/main.py`.

## 🔮 Future Improvements

- Add rate limiting for API endpoints.
- Implement RabbitMQ for async ETL processing.
- Optimize RAG with custom prompt templates.
- Deploy with Docker Compose for production.

## 📜 License

MIT License © 2025
