from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)
# Configuração do banco de dados SQLite
DATABASE = 'database.db'

# Faz conexão
CONNECTION = sqlite3.connect(DATABASE,check_same_thread=False)
CURSOR = CONNECTION.cursor()

@app.route('/geolocation', methods=['POST'])
def geolocation():
    data = request.get_json()
    # Faça algo com a geolocalização aqui
    return jsonify({'status': 'success'})

# Função para conectar ao banco de dados
def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

# Função para criar a tabela de dados, se ela não existir
def executa_schema_se_nao_existir_tabela():
    with app.app_context():
        db = get_db()
        with app.open_resource('drop_schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        with app.open_resource('create_schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# Rota para criar a tabela de dados
@app.route('/initdb')
def inicializa_bd():
    executa_schema_se_nao_existir_tabela()
    return 'Database inicializada'

@app.route('/estrutura_usuario', methods=['GET'])
def estrutura_usuario():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM pragma_table_info('usuario')")
        dados = cursor.fetchall()
        return jsonify([dict(row) for row in dados])
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()




@app.route('/')
@app.route('/index')
def home():
    return render_template('index.html')


@app.route('/rotas')
def rotas():
    conteudo = """
    <h1>Bem-vindo à API CRUD com Flask</h1>
    <p>Esta API permite que você execute operações CRUD (Create, Read, Update, Delete) em uma base de dados SQLite.</p>
    <p>Rotas disponíveis:</p>
    <ul>
        <li>POST /usuarios - Adiciona um novo dado. Envie um JSON com os campos 'nome' ,'tipo', 'lat' e 'lng', o campo 'id' é autoincrementado.</li>
        <li>GET /usuarios - Retorna todos os dados na base de dados.</li>
        <li>GET /usuarios/{id} - Retorna um dado específico por ID.</li>
        <li>PUT /usuarios/{id} - Atualiza um dado existente por ID. Envie um JSON com os campos 'nome' , 'lat' e 'lng'.</li>
        <li>DELETE /usuarios/{id} - Deleta um dado existente por ID.</li>
    </ul>
    """
    return conteudo


# Consulta de todos os usuários
@app.route('/usuarios', methods=['GET'])
def retorna_usuarios():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM usuario')
        dados = cursor.fetchall()
        return jsonify([dict(row) for row in dados])
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# Consulta de 1 usuário
@app.route('/usuarios/<int:id>', methods=['GET'])
def retorna_usuario(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM usuario WHERE id = ?', (id,))
        dado = cursor.fetchone()
        if dado:
            return jsonify(dict(dado))
        else:
            return jsonify({'error': 'Dado não encontrado'}), 404
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# Alterar de 1 usuário
@app.route('/usuarios/<int:id>', methods=['PUT'])
def alterar_usuario(id):
    nome = request.json.get('nome')
    tipo = request.json.get('tipo')
    latitude = request.json.get('lat')
    longitude = request.json.get('lng')
    if not nome or not latitude or not longitude:
        return jsonify({'error': 'Nome, tipo, latitude e longitude são obrigatórios'}), 400
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('UPDATE usuario SET nome = ?, tipo = ?, lat = ?, lng = ? WHERE id = ?', (nome, tipo, latitude, longitude, id))
        db.commit()
        return jsonify({'message': 'Dado atualizado com sucesso!'})
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/usuarios', methods=['POST', 'GET'])
def novo_usuario():
    if request.method == 'POST':
        nome = request.json.get('nome')
        tipo = request.json.get('tipo')
        latitude = float(request.json.get('lat'))
        longitude = float(request.json.get('lng'))

        if not nome or not tipo or not latitude or not longitude:
            return jsonify({'error': 'nome:text, tipo:text latitude:float e longitude:float são obrigatórios'}), 400

        try:
            db = get_db()
            cursor = db.cursor()
            cursor.execute('INSERT INTO usuario (nome, tipo, lat, lng) VALUES (?, ?, ?, ?)', (nome, tipo, latitude, longitude))
            db.commit()

            # Obter o ID do usuário recém-criado
            user_id = cursor.lastrowid

            # Retornar o ID do usuário junto com a mensagem de sucesso
            return jsonify({'message': 'Usuário adicionado com sucesso!', 'id': user_id}), 201
        except sqlite3.Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            db.close()
    elif request.method == 'GET':
        return home()



# Excluir Usuário
@app.route('/usuarios/<int:id>', methods=['DELETE'])
def exclui_usuario(id):
    try:
        id = int(id)
        db = get_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM usuario WHERE id = ?', (id,))
        db.commit()
        return jsonify({'message': 'Usuário deletado com sucesso!'})
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


if __name__ == '__main__':
    app.run(port=5000,host='localhost',debug=True)

