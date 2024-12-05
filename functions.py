import hashlib

def hashpassword(password):
    salt = "weyuuhriluwrliywg"
    password_2_hashed = salt + password
    hasher = hashlib.md5()
    hasher.update(password.encode('utf-8'))
    hashed_password = hasher.hexdigest()
    return hashed_password

