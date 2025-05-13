from flask import Flask, render_template, request, redirect, url_for, flash
import firebase_admin
from firebase_admin import credentials, auth

# Inicializa Firebase Admin SDK
cred = credentials.Certificate('firebase_config.json')  # Ruta a tu archivo de configuración de Firebase
firebase_admin.initialize_app(cred)

app = Flask(__name__)
app.secret_key = 'supersecreto'  # Necesario para usar flash()

# Página de inicio (login)
@app.route('/')
def index():
    return render_template('login.html')  # Asegúrate de tener login.html en tu carpeta templates

# Ruta para el login
@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']
    
    try:
        # Verificar el correo en Firebase
        user = auth.get_user_by_email(email)
        
        # Si la autenticación es exitosa, se puede redirigir al dashboard
        return redirect(url_for('dashboard'))
    except Exception as e:
        # Si ocurre un error, muestra un mensaje de error sin redirigir
        flash('Correo o contraseña incorrectos. Intenta nuevamente.', 'error')
        return redirect(url_for('index'))

# Dashboard principal
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# Ruta: Inventario
@app.route('/inventario')
def inventario():
    return render_template('inventario.html')

# Ruta: Ventas
@app.route('/ventas')
def ventas():
    return render_template('ventas.html')

# Ruta: Cerrar sesión (opcional)
@app.route('/logout')
def logout():
    return redirect(url_for('index'))  # Aquí podrías limpiar sesión si la implementas

if __name__ == '__main__':
    app.run(debug=True)
