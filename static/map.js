

function existeLocalStorage(){
    var savedUserId = localStorage.getItem('userId');
    if (savedUserId){
        return true
    } else {
        return false
    }
}


function existeUsuarioNoServidor(id) {
    var url = 'http://localhost:5000/usuarios/' + id;
    console.log('Verificando usuário no servidor: ' + url);

    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            console.log('Usuário encontrado no servidor: ID ' + id);
            return true;  // Usuário existe
        } else if (response.status === 404) {
            console.log('Usuário não encontrado: ID ' + id);
            return false;  // Usuário não existe
        } else {
            throw new Error('Erro ao verificar usuário: ' + response.status);
        }
    })
    .catch(error => {
        console.log("Erro: " + error.message);
        return false;  // Em caso de erro, assume que o usuário não existe
    });
}

function criaUsuarioLocal(lat,lng){
    console.log("Criando Localmente Usuário")
    localStorage.setItem('userName',document.getElementById('userNameInput').value);
    localStorage.setItem('userlatitude', lat);
    localStorage.setItem('userlongitude', lng);
}

function atualizaUsuarioLocal(lat,lng){
    localStorage.setItem('userName',document.getElementById('userNameInput').value);
    localStorage.setItem('userlatitude', lat);
    localStorage.setItem('userlongitude', lng);
}

function criarUsuarioNoServidor(nome,lat,lng) {
    console.log("criarUsuarioNoServidor ("+nome+','+lat+','+lng+')')
    var url = 'http://localhost:5000/usuarios';
    console.log('criarUsuarioServidor => url('+url+')')

    var data = {
        lat: lat,
        lng: lng,
        nome: nome,
        tipo: "pessoa"
    };
    console.log('criarUsuarioServidor => data('+JSON.stringify(data)+')')

    fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log("Status da resposta: ", response.status);
        return response.json().then(data => {
            console.log("Resposta do servidor:", data);
            if (response.ok) {
                return data;
            } else {
                throw new Error('Erro ao tentar criar usuário');
            }
        });
    })
    .then(data => {
        // Aqui assumimos que o servidor está retornando o ID do usuário criado
        var userId = data.id;
        console.log("ID do usuário criado: ", userId);

        // Armazenar o ID no localStorage
        localStorage.setItem('userId', userId);

        alert("Usuário criado com sucesso no Servidor");
    })
    .catch(error => {
        console.log("Erro: " + error.message);
    });
}

function validaInformacoes(nome,lat,lng){
    ok = true
    campos = []
    if (nome == null){
        campos.push('nome')
        ok = false
    }
    if (lat == null){
        campos.push('lat')
        ok = false
    }
    if (lng == null){
        campos.push('lat')
        ok = false
    }

    if (!ok){
        console.log("validaInformacoes => Campos null:",campos)
    }

    return ok
}

function getLocation() {
    console.log("imprimindo aqui")
    var latitude = null;
    var longitude = null;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {

            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            localStorage.setItem('userlatitude', latitude);
            localStorage.setItem('userlongitude', longitude);

            document.getElementById("location").innerHTML = "Latitude: " + latitude + "<br>Longitude: " + longitude;
            fetch('/geolocation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude: latitude,
                    longitude: longitude
                })
            });

            var data = null;
            var map = null;
            var existeLocalmente = existeLocalStorage()
            var existeNoServidor = false

            if (existeLocalmente){

               console.log("Usuário Existe Localmente")
               localStorage.setItem('userName',document.getElementById('userNameInput').value);
               existeNoServidor = existeUsuarioNoServidor(localStorage.getItem('userId'))
               if (existeNoServidor){
                 console.log("Usuário Existe no SERVIDOR")
                 atualizaUsuarioLocal(latitude,longitude)
                 if (validaInformacoes(localStorage.getItem('userName'),localStorage.getItem('userlatitude'),localStorage.getItem('userlongitude'))){
                     atualizaNoServidor()

                     //atualiza objetos na pagina
                     recarregarPagina()




                 } else {
                    console.log("Usuário deve ser atualizado mas alguma informação está null")
                 }
               } else {
                 console.log("Usuário NÃO Existe no SERVIDOR")
                 if (validaInformacoes(localStorage.getItem('userName'),localStorage.getItem('userlatitude'),localStorage.getItem('userlongitude'))){
                    criarUsuario(localStorage.getItem('userId'),localStorage.getItem('userName'),localStorage.getItem('userlatitude'),localStorage.getItem('userlongitude'))
                 } else {
                    console.log("Usuário deve ser criado mas alguma informação está null")
                 }
               }
            } else {

                console.log("Usuário NÃO Existe Localmente")
                criaUsuarioLocal(latitude,longitude)
                existeNoServidor = existeUsuarioNoServidor(localStorage.getItem('userId'))
                if (existeNoServidor){

                     console.log("Usuário Existe no SERVIDOR")

                     criarUsuarioNoServidor(localStorage.getItem('userName'),localStorage.getItem('userlatitude'),localStorage.getItem('userlongitude'))
                } else {

                     console.log("Usuário NÃO Existe no SERVIDOR")
                     if (validaInformacoes(localStorage.getItem('userName'),localStorage.getItem('userlatitude'),localStorage.getItem('userlongitude'))){
                        criarUsuarioNoServidor(localStorage.getItem('userName'),localStorage.getItem('userlatitude'),localStorage.getItem('userlongitude'))
                     } else {
                        console.log("Usuário deve ser criado mas alguma informação está null")
                     }
               }
            }

        });

    } else {
        console.log("Geolocalização não é suportada por este navegador.");
    }
}



function atualizaNoServidor(){


    // Criar o objeto JSON com os dados
    data = {
        lat: localStorage.getItem('userlatitude'),
        lng: localStorage.getItem('userlongitude'),
        nome: localStorage.getItem('userName'),
        tipo: "pessoa"
    };

    // Enviar os dados para o servidor
    fetch("http://localhost:5000/usuarios/"+localStorage.getItem('userId'), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert('Sucesso  ao atualizar usuário no Servidor ('+id+','+nome+','+lat+','+lng+')');
    })
    .catch((error) => {
        console.log('Erro ao tentar atualizar no Servidor ('+id+','+nome+','+lat+','+lng+')');
    });
}

function recarregarPagina(){
    var pessoaIcon = L.icon({
    iconUrl: 'static/pessoa.png',
    iconSize: [32, 32], // Ajuste o tamanho conforme necessário
    iconAnchor: [22, 38], // Ajuste o ponto de ancoragem conforme necessário
    popupAnchor: [-3, -76] // Ajuste o ponto do popup conforme necessário
    });
    var estacionamentoIcon = L.icon({
    iconUrl: 'static/estacionamento.png',
    iconSize: [32, 32], // Ajuste o tamanho conforme necessário
    iconAnchor: [22, 38], // Ajuste o ponto de ancoragem conforme necessário
    popupAnchor: [-3, -76] // Ajuste o ponto do popup conforme necessário
    });
    var cidadeIcon = L.icon({
    iconUrl: 'static/cidade.png',
    iconSize: [32, 32], // Ajuste o tamanho conforme necessário
    iconAnchor: [22, 38], // Ajuste o ponto de ancoragem conforme necessário
    popupAnchor: [-3, -76] // Ajuste o ponto do popup conforme necessário
    });
    var aeroportoIcon = L.icon({
    iconUrl: 'static/aeroporto.png',
    iconSize: [32, 32], // Ajuste o tamanho conforme necessário
    iconAnchor: [22, 38], // Ajuste o ponto de ancoragem conforme necessário
    popupAnchor: [-3, -76] // Ajuste o ponto do popup conforme necessário
    });
    var turismoIcon = L.icon({
    iconUrl: 'static/turismo.png',
    iconSize: [32, 32], // Ajuste o tamanho conforme necessário
    iconAnchor: [22, 38], // Ajuste o ponto de ancoragem conforme necessário
    popupAnchor: [-3, -76] // Ajuste o ponto do popup conforme necessário
    });
    var livrariaIcon = L.icon({
    iconUrl: 'static/livraria.png',
    iconSize: [32, 32], // Ajuste o tamanho conforme necessário
    iconAnchor: [22, 38], // Ajuste o ponto de ancoragem conforme necessário
    popupAnchor: [-3, -76] // Ajuste o ponto do popup conforme necessário
    });

    // Inicializa o mapa
    map = L.map('map').setView([-15.7801, -47.9292], 4); // Centra o mapa no Brasil

    // Adiciona a camada do mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Obtém os dados dos usuários
    fetch('/usuarios')
    .then(response => response.json())
    .then(data => {
        data.forEach(user => {
             var markerIcon = null;

            // Escolhe o ícone apropriado baseado no tipo do usuário
            switch (user.tipo) {
                case "estacionamento":
                    markerIcon = estacionamentoIcon;
                    break;
                case "cidade":
                    markerIcon = cidadeIcon;
                    break;
                case "aeroporto":
                    markerIcon = aeroportoIcon;
                    break;
                case "turismo":
                    markerIcon = turismoIcon;
                    break;
                case "livraria":
                    markerIcon = livrariaIcon;
                    break;
                case "pessoa":
                    markerIcon = pessoaIcon;
                    break;
                default:
                    markerIcon = pessoaIcon; // Ou um ícone padrão se necessário
                    break;
            }


            // Cria o marcador com o ícone apropriado
            var marker = L.marker([user.lat, user.lng], { icon: markerIcon }).addTo(map);

            // Cria um elemento HTML para o popup
            var popupContent = document.createElement('div');
            popupContent.id = 'obj' + user.id; // Define o ID do elemento HTML
            popupContent.innerHTML = "<b>Nome:</b> " + user.nome + "<br><b>Id:</b> " + user.id + "<br><b>Tipo:</b> " + user.tipo;

            // Vincula o elemento HTML ao popup do marcador
            marker.bindPopup(popupContent);


        });
    })
    .catch(error => {
        console.error('Erro ao buscar dados dos usuários:', error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    recarregarPagina()
});
