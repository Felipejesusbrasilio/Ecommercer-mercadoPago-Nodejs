const Sequelize = require('sequelize');

const conexao = new Sequelize('here','root','',{
	host:'localhost',
	dialect:'mysql'
})

module.exports = conexao;