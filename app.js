var express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	cons = require('consolidate'),
	dust = require('dustjs-helpers'),
	pg = require('pg'),
	app = express();

var connect,
	env = process.env.NODE_ENV || 'development';
if (env === 'production') {
	pg.defaults.ssl = true;
  	connect = process.env.DATABASE_URL;
} else {
	var config = require('./config.json');
  	connect = "postgres://"+ config.username +":"+ config.password +"@localhost/recipebookdb";
}

app.engine('dust', cons.dust);

app.set('view engine', 'dust');
app.set('views', __dirname+'/views');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
	pg.connect(connect, function(err, client, done) {
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		client.query('SELECT * FROM recipes', function(err, result) {
			if(err) {
				return console.error('error running query', err);
			}
			res.render('index', {recipes: result.rows});
			done();
		});
	});
});

app.post('/add', function(req, res){
	pg.connect(connect, function(err, client, done) {
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		client.query('INSERT INTO recipes(name, ingredients, directions) VALUES($1, $2, $3)', [req.body.name, req.body.ingredients, req.body.directions]);
		done();
		res.redirect('/');
	});
});

app.delete('/delete/:id', function(req, res){
	pg.connect(connect, function(err, client, done) {
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		client.query('DELETE FROM recipes WHERE id = $1', [req.params.id]);
		done();
		res.sendStatus(200);
	});
});

app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
	console.log('Server started on port: '+app.get('port'));
});