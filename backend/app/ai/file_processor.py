import PyPDF2
import docx
import io
from typing import Optional


def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc_file = io.BytesIO(file_content)
        doc = docx.Document(doc_file)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")


def extract_text_from_email(file_content: bytes) -> str:
    """Extract text from email file (.eml, .msg)"""
    try:
        import email
        from email import policy
        
        email_message = email.message_from_bytes(file_content, policy=policy.default)
        
        text_parts = []
        text_parts.append(f"Subject: {email_message.get('Subject', '')}")
        text_parts.append(f"From: {email_message.get('From', '')}")
        text_parts.append(f"To: {email_message.get('To', '')}")
        text_parts.append(f"Date: {email_message.get('Date', '')}")
        text_parts.append("")
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    text_parts.append(part.get_content())
                elif content_type == "text/html":
                    import re
                    html = part.get_content()
                    text_parts.append(re.sub('<[^<]+?>', '', html))
        else:
            text_parts.append(email_message.get_content())
        
        return "\n".join(text_parts).strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from email: {str(e)}")


def extract_text_from_file(file_content: bytes, file_name: str) -> str:
    """Extract text from file based on extension"""
    file_name_lower = file_name.lower()
    
    if file_name_lower.endswith('.pdf'):
        return extract_text_from_pdf(file_content)
    elif file_name_lower.endswith('.docx') or file_name_lower.endswith('.doc'):
        return extract_text_from_docx(file_content)
    elif file_name_lower.endswith('.eml') or file_name_lower.endswith('.msg'):
        return extract_text_from_email(file_content)
    elif file_name_lower.endswith('.txt'):
        return file_content.decode('utf-8', errors='ignore')
    else:
        # Try to decode as text
        try:
            return file_content.decode('utf-8', errors='ignore')
        except:
            raise ValueError(f"Unsupported file type: {file_name}")