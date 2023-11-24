from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from langchain.document_loaders import PyPDFLoader

app = Flask(__name__)


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

    # Save the file temporarily
    filename = secure_filename(file.filename)
    file.save(filename)

    # Process the file using PyPDFLoader
    loader = PyPDFLoader(filename)
    pages = loader.load_and_split()

    # Extract and process the text as needed
    extracted_texts = [doc.page_content for doc in pages]

    # Clean up the saved file
    # os.remove(filename)

    return jsonify(extracted_texts)


if __name__ == '__main__':
    app.run(debug=True)
