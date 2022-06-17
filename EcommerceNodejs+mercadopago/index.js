const express = require('express');

const server = express();

server.use(express.static(__dirname+'/public'));

server.set('view engine','ejs');

const BodyParser = require('body-parser');

server.use(BodyParser.urlencoded({extended:false}));

server.use(BodyParser.json());

const Sequelize = require('sequelize');

const mysql2 = require('mysql2');

const connectar = require('./database/database');

const slugify = require('slugify');

const bcrypt = require('bcryptjs');

const cors = require('cors');

const Correios = require('node-correios');
const correios = new Correios();

const mercadoPago = require('mercadopago');

mercadoPago.configure({
  sandbox:true,
  access_token: process.env.ACCESS_TOKEN="TEST-4522866936185161-060717-f824639b1aacf466f87fac9532a581d1-409071910"
})

const date = Date;


let payments = [];

server.use(cors());

connectar.authenticate().then(()=>{
	console.log('connectado com sucesso');
}).catch((error)=>{
	console.log('error ao connectar a base de dados'+error);
})

const connectarMysql2 = mysql2.createConnection({
  host:'localhost',
  user:'root',
  database:'here'
})

if(connectarMysql2){
  console.log('connectado com sucesso mysql2');
}else{
  console.log('error ao connectar');
}

const tabela = connectar.define('produtos-crud',{
	nome:{type:Sequelize.STRING},
  imagem:{type:Sequelize.STRING},
  preco:{type:Sequelize.STRING},
})

const frete = connectar.define('frete',{
  valor:{type:Sequelize.STRING},
})


const tamanhos = connectar.define('tamanhos',{
  p:{type:Sequelize.STRING},
  m:{type:Sequelize.STRING},
  g:{type:Sequelize.STRING},
  gg:{type:Sequelize.STRING},
})

//frete.sync({force:true}).then('tabela criada com sucesso').catch((error)=>{console.log('error ao criar a tabela'+error)});
//tabela.sync({force:true}).then('tabela criada com sucesso').catch((error)=>{console.log('error ao criar a tabela'+error)});
//tabela.belongsTo(frete,{constraint:true,foreignKey:'total'});
//tamanhos.sync({force:true}).then('tabela criada com sucesso').catch((error)=>{console.log('error ao criar a tabela'+error)});


const usuarios = connectar.define('Usuarios',{
     email:{type:Sequelize.STRING},
     repetir_email:{type:Sequelize.STRING},
     nome:{type:Sequelize.STRING},
     sobre_nome:{type:Sequelize.STRING},
     cpf:{type:Sequelize.STRING},
     telefone:{type:Sequelize.STRING},
     celular:{type:Sequelize.STRING},
     nacimento:{type:Sequelize.STRING},
     masculino:{type:Sequelize.STRING},
     feminino:{type:Sequelize.STRING},
     senha:{type:Sequelize.STRING},
     repetir_senha:{type:Sequelize.STRING},
     cep:{type:Sequelize.STRING},
     rua:{type:Sequelize.STRING},
     numero:{type:Sequelize.STRING},
     complemento:{type:Sequelize.STRING},
     referencia:{type:Sequelize.STRING},
     bairro:{type:Sequelize.STRING},
     cidade:{type:Sequelize.STRING},
     estado:{type:Sequelize.STRING},
     novidades:{type:Sequelize.STRING}
})

//usuarios.sync({force:true}).then('tabela criada com sucesso').catch((error)=>{console.log('error ao criar a tabela'+error)});


server.listen(8000,(error)=>{
	if(error){
      console.log('error ao iniciar servidor node js');
	}else{
      console.log('servidor node js iniciado com sucesso');
	}
})


server.get('/',(req,res)=>{
	res.render('../views/painel');
})


server.get('/formulario',(req,res)=>{
     res.render('../views/formulario');
})


server.get('/carrinho',(req,res)=>{

usuarios.findAll().then(nome=>{
  res.render('../views/1',{nome:nome});
})

})

server.get('/frete',(req,res)=>{
  frete.findAll().then((valor)=>{
    res.render('../views/result-frete',{valor:valor});
  })
})

// aqui é a api do correrio

server.post('/api-correrios',(req,res)=>{
  let cep = req.body.cep;
  
  const args = {
    nCdServico:'04014',
    sCepOrigem:'05387100',
    sCepDestino:cep,
    nVlPeso:'0.30',
    nCdFormato:'1',
    nVlComprimento:'20',
    nVlAltura:'30',
    nVlLargura:'23',
    nVlDiametro:'10'
}

  correios.calcPreco(args).then(result=>{
    //console.log(result);
    result.forEach(results=>{
      console.log(results.Valor);
      frete.create({valor:results.Valor});
    })
    
    frete.findAll().then((r)=>{
      if(r != 1){
        frete.destroy({truncate:{id:true}});
      }else{
        console.log('não existe dados');
      }
    })

    res.render('../views/fretes',{valor:result})
  }).catch(error=>{
    console.log(error);
  })

})


server.get('/frete',(req,res)=>{
  res.render('../views/fretes');
})


// aqui esta printando os produtos na pagina produto e tambem esta verificando se o mysql estiver vazio
// então ele vai limpa a tabela só assim o id vai volta do 1

server.get('/sacola',(req,res)=>{
  tabela.findAll().then((nome)=>{
    if (nome == ''){
      console.log('a tabela esta vazia');
      tabela.destroy({truncate:true,id:undefined});
      tamanhos.destroy({truncate:true,id:undefined});
      res.render('../views/pages/produto',{nome:nome});
    }else{
      console.log('existe items na tabela');
      res.render('../views/pages/produto',{nome:nome});
    }
  })
  
})

// aqui estamos vendo se tem o usuario no banco de dados

server.post('/dados-login',(req,res)=>{
  let email = req.body.email;
  let senha = req.body.senha;
  
  usuarios.findOne({where:{email:email,senha:senha}}).then(r=>{
    if(r == undefined){
      res.render('../views/login-error');
    }else{
      res.render('../views/login-positivo')
    }
  }).catch((error)=>{
    console.log('erro'+error);
  })


})


// aqui estamos pegando os dados do formulario

server.post('/dados-form',(req,res)=>{

let email = req.body.email;
let repetir_email = req.body.repetir_email;
let nome = req.body.nome
let sobre_nome = req.body.sobre;
let cpf = req.body.cpf;
let telefone = req.body.telefone;
let celular = req.body.celular;
let nacimento = req.body.nacimento;
let masculino = req.body.masculino;
let feminino = req.body.feminino;
let senha = req.body.senha;
let repetir_senha = req.body.repetir_senha;
let cep = req.body.cep;
let rua = req.body.rua;
let numero = req.body.numero;
let complemento = req.body.complemento;
let referencia = req.body.referencia;
let bairro = req.body.bairro;
let cidade = req.body.cidade;
let estado = req.body.estado;
let novidades = req.body.novidades;

// aqui é a quiptrografia da senha

//let salt = bcrypt.genSaltSync(10);
//let hash = bcrypt.hashSync(senha,salt);

if(email == '' || repetir_email == ''|| nome == '' || sobre_nome == '' ||
   cpf == '' || telefone == '' || celular == '' || nacimento == '' || masculino == '' ||
   feminino == '' || senha == '' || repetir_senha == '' || cep == '' || rua == '' ||
   numero == '' || complemento == '' || referencia == '' || bairro == '' || cidade == '' ||
   estado == '' || novidades == ''
  ){
  res.render('../views/negativo');
}else{
  usuarios.create({
    email:email,
    repetir_email:repetir_email,
    nome:nome,
    sobre_nome,
    cpf:cpf,
    telefone:telefone,
    celular:celular,
    nacimento:nacimento,
    masculino:masculino,
    feminino:feminino,
    senha:senha,
    repetir_senha:repetir_senha,
    cep:cep,
    rua:rua,
    numero:numero,
    complemento:complemento,
    referencia:referencia,
    bairro:bairro,
    cidade:cidade,
    estado:estado,
    novidades:novidades,

  }).then(()=>{
     res.render('../views/positivo');
  });
} 


})


// aqui estamos deletando os produtos

server.post('/deletar',(req,res)=>{
   let id = req.body.id;

   if (id != undefined){
    if (!isNaN(id)){
       tabela.destroy({
        where:{id:id}
       }).then((id)=>{
        res.render('../views/alerta-deletar');
       }).catch((error)=>{
        console.log('error'+error);
       })

       tamanhos.destroy({where:{id:id}}).then((id)=>{
        res.render('../views/alerta-deletar');
       }).catch((error)=>{
         console.log('error ao deletar tamanhos'+error);
       })

    }else{
       res.redirect('/');
    }

   }else{
       res.redirect('/')
   }
})


// aqui são os posts do produtos

server.post('/carrinho/1',(req,res)=>{
   
   let imagem = 'imagem01.png';
   let nome = 'lacoste01';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})


server.post('/carrinho/2',(req,res)=>{
   
   let imagem = 'imagem02.png';
   let nome = 'lacoste02';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})


server.post('/carrinho/3',(req,res)=>{
   
   let imagem = 'imagem03.png';
   let nome = 'lacoste03';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/4',(req,res)=>{
   
   let imagem = 'imagem04.png';
   let nome = 'lacoste04';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/5',(req,res)=>{
   
   let imagem = 'imagem05.png';
   let nome = 'lacoste05';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })
})

server.post('/carrinho/6',(req,res)=>{
   
   let imagem = 'imagem06.png';
   let nome = 'lacoste06';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/7',(req,res)=>{
   
   let imagem = 'imagem07.png';
   let nome = 'lacoste07';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/8',(req,res)=>{
   
   let imagem = 'imagem08.png';
   let nome = 'lacoste08';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/9',(req,res)=>{
   
   let imagem = 'imagem09.png';
   let nome = 'lacoste09';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/10',(req,res)=>{
   
   let imagem = 'imagem10.png';
   let nome = 'lacoste10';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/11',(req,res)=>{
   
   let imagem = 'imagem11.png';
   let nome = 'calca01';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/12',(req,res)=>{
   
   let imagem = 'imagem12.png';
   let nome = 'calca02';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})


server.post('/carrinho/13',(req,res)=>{
   
  let imagem = 'imagem13.png';
   let nome = 'calca03';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/14',(req,res)=>{
   
   let imagem = 'imagem14.png';
   let nome = 'calca04';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/15',(req,res)=>{
   
   let imagem = 'imagem15.png';
   let nome = 'calca05';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/16',(req,res)=>{
   
   let imagem = 'imagem16.png';
   let nome = 'calca06';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/17',(req,res)=>{
   
   let imagem = 'imagem17.png';
   let nome = 'calca07';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/18',(req,res)=>{
   
   let imagem = 'imagem18.png';
   let nome = 'calca08';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/19',(req,res)=>{
   
   let imagem = 'imagem19.png';
   let nome = 'calca09';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/20',(req,res)=>{
   
   let imagem = 'imagem20.png';
   let nome = 'calca10';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/21',(req,res)=>{
   
   let imagem = 'imagem21.png';
   let nome = 'bone01';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/22',(req,res)=>{
   
   let imagem = 'imagem22.png';
   let nome = 'bone02';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/23',(req,res)=>{
   
   let imagem = 'imagem23.png';
   let nome = 'bone03';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/24',(req,res)=>{
   
   let imagem = 'imagem24.png';
   let nome = 'bone04';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/25',(req,res)=>{
   
   let imagem = 'imagem25.png';
   let nome = 'bone05';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/26',(req,res)=>{
   
   let imagem = 'imagem26.png';
   let nome = 'bone06';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/27',(req,res)=>{
   
   let imagem = 'imagem27.png';
   let nome = 'bone07';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/28',(req,res)=>{
   
   let imagem = 'imagem28.png';
   let nome = 'bone08';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/29',(req,res)=>{
   
   let imagem = 'imagem29.png';
   let nome = 'bone09';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/30',(req,res)=>{
   
   let imagem = 'imagem30.png';
   let nome = 'bone10';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/31',(req,res)=>{
   
   let imagem = 'imagem31.png';
   let nome = 'bone10';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})


server.post('/carrinho/32',(req,res)=>{
   
   let imagem = 'imagem32.png';
   let nome = 'produtoExtra01';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/33',(req,res)=>{
   
   let imagem = 'imagem33.png';
   let nome = 'produtoExtra02';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/34',(req,res)=>{
   
   let imagem = 'imagem34.png';
   let nome = 'produtoExtra03';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/35',(req,res)=>{
   
   let imagem = 'imagem35.png';
   let nome = 'produtoExtra04';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/36',(req,res)=>{
   
   let imagem = 'imagem36.png';
   let nome = 'produtoExtra05';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/37',(req,res)=>{
   
   let imagem = 'imagem37.png';
   let nome = 'produtoExtra06';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/38',(req,res)=>{
   
   let imagem = 'imagem38.png';
   let nome = 'produtoExtra07';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/39',(req,res)=>{
   
   let imagem = 'imagem39.png';
   let nome = 'produtoExtra08';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/40',(req,res)=>{
   
   let imagem = 'imagem40.png';
   let nome = 'produtoExtra09';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/41',(req,res)=>{
   
   let imagem = 'imagem41.png';
   let nome = 'produtoExtra10';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/42',(req,res)=>{
   
   let imagem = 'imagem42.png';
   let nome = 'produtoExtra11';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/43',(req,res)=>{
   
   let imagem = 'imagem43.png';
   let nome = 'produtoExtra12';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/44',(req,res)=>{
   
   let imagem = 'imagem44.png';
   let nome = 'produtoExtra13';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/45',(req,res)=>{
   
   let imagem = 'imagem45.png';
   let nome = 'produtoExtra14';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/46',(req,res)=>{
   
   let imagem = 'imagem46.png';
   let nome = 'produtoExtra15';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/47',(req,res)=>{
   
   let imagem = 'imagem47.png';
   let nome = 'produtoExtra16';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/48',(req,res)=>{
   
   let imagem = 'imagem48.png';
   let nome = 'produtoExtra17';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/49',(req,res)=>{
   
   let imagem = 'imagem49.png';
   let nome = 'produtoExtra18';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

server.post('/carrinho/50',(req,res)=>{
   
   let imagem = 'imagem50.png';
   let nome = 'produtoExtra19';
   let valor = 250;
   
   // aqui estamos jogando os nomes dos produtos no banco de dados
   tabela.create({
     nome:nome,
     preco:valor,
     imagem:imagem
   }).then(()=>{
     console.log('produto cadastrado com sucesso');
   // aqui estamos verificando se existe um usuario no banco de dados se existir ele vai ser redirecionado
   //para a sacola se não não vai ser ok mas o produto esta cadastrado do mesmo jeito
   usuarios.findAll().then((resposta)=>{
    if(resposta == ''){
      let alerta = 'POR FAVOR REALIZE O CADASTRO';
      res.render('../views/alerta');
    }else{
    tabela.findAll().then((nome)=>{
    res.render('../views/pages/produto',{nome:nome});
    })

    }

   })
   
   }).catch((error)=>{
     console.log('error ao cadastrar produto'+error);
   })

})

// aqui é quando a pessoa clicar em enviar tamanho ai vai para a tela dos alertas 


  server.post('/pagina/1',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})


 server.post('/pagina/2',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/3',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})


 server.post('/pagina/4',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})


 server.post('/pagina/5',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

 server.post('/pagina/6',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})


 server.post('/pagina/7',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})


 server.post('/pagina/8',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})


 server.post('/pagina/9',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 


 server.post('/pagina/10',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 


 server.post('/pagina/11',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 


 server.post('/pagina/12',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 


 server.post('/pagina/13',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 

 server.post('/pagina/14',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 

 server.post('/pagina/15',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 

 server.post('/pagina/16',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 

 server.post('/pagina/17',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 

 server.post('/pagina/18',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
}) 

 server.post('/pagina/19',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  

 server.post('/pagina/20',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  

 server.post('/pagina/21',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/22',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/23',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/24',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/25',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/26',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/27',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/28',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  


 server.post('/pagina/29',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})  



server.post('/pagina/30',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/31',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/32',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/33',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/34',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/35',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/36',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/37',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/38',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/39',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})


server.post('/pagina/40',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})


server.post('/pagina/41',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/42',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/43',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/44',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/45',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/46',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/47',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/48',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/49',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

server.post('/pagina/50',(req,res)=>{

  let p = req.body.p;
  let m = req.body.m;
  let g = req.body.g;
  let gg = req.body.gg;
  
  if(p != undefined || m != undefined || g != undefined || gg != undefined){
    console.log('tamanho registrado com sucesso');
    tamanhos.create({
      p:p,
      m:m,
      g:g,
      gg:gg
    }).then(()=>{
     
     res.render('../views/alerta-tamanhos-positivo');

    })

  }else{
    res.render('../views/alerta-tamanhos');
  }
 
})

// aqui entra a mercadoPago button comprar

server.get('/comprar',(req,res)=>{


tamanhos.findAll().then((r)=>{
  if(r == false){
    res.render('../views/alerta-tamanhos');
  }else{
  

  connectarMysql2.query("SELECT SUM(t.preco) AS valor FROM (SELECT preco FROM `produtos-cruds` UNION ALL SELECT valor FROM fretes) t;",function(error,results){
  results.forEach(async r=>{ 

   let dados = {
    items: [
      item = {
        id: r.id, // id da venda
        title: 'Shopping-here',
        quantity: 1, // quantidade, multiplica o preço unitário
        currency_id: 'BRL',
        unit_price: parseFloat(r.valor) // preço que o usuário vai pagar
      }
    ],

    payer: { // quem vai pagar aqui tenho que colocar r.email por que foi o email que o clinete cadastro
      email:'pagamento.shopping-here@outlook.com'
    },
    external_reference: r.id,
  }

  try {
    // Gera um pagamento
    let pagamento = await mercadoPago.preferences.create(dados)
  
    // Insere um novo pagamento

    let payments = [
      email=>'pagamento.shopping-here@outlook.com',
      id_payment=>r.id,
      name=>'shopping-here',
      price=>parseFloat(r.valor),
      status=>'A pagar'
    ]
    
    // Retorna o checkout para o usuário
    return res.redirect(pagamento.body.init_point);
  } catch(error) {
    return res.send(error.message)
  }


  // continuar aqui as nodifications de for aprovado o pagamento

  //https://github.com/gabrielogregorio/integration-mercado-pago
  })

})

}

})

})


server.post('/notify', (req, res) => {
  
  let id = req.query.id;

  console.log('chegou!')

  // Esperar 20s para o mercado pago cadastrar a venda no db deles.
  setTimeout(() => {
    var filtro = { "order.id": id }

    // Verifica se o pagamento está no banco de dados do mercado pago
    mercadoPago.payment.search({
      qs: filtro
    }).then(data => {
      // Pagamento está no banco de dados
      var payment = data.body.results[0]
      if (payment != undefined) {

        if (payment.status === 'approved') {
          
        payments.findIndex(pay => pay == payment.external_reference)
        payments.status = 'Pago';

        console.log(payments);

           
        } else {
          console.log('pagamento não aprovado!', payment.status)
        }
      } else {
        console.log('Pagamento não existe!', payment)
      }
    }).catch(error => {
      console.log(error)
    })
  }, 20000) // 20s

  res.send('ok');

  
})

