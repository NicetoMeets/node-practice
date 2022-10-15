const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const MongoClient = require('mongodb').MongoClient;

let db;
MongoClient.connect('mongodb+srv://puma1800:ghfkddl7@cluster0.soieyzo.mongodb.net/?retryWrites=true&w=majority',
    function (에러, client) {
        if (에러) return console.log(에러);

        db = client.db('nodeapp');

        db.collection('post').insertOne({ 이름: 'John', 나이: 40 }, function (에러, 결과) {
            console.log('저장완료');
        });

        app.listen('1215', function () {
            console.log('listening on 1215')
        });
    })



app.get('/beauty', function (req, res) {
    res.send('뷰티용품 사이트 입니다');
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/write', function (req, res) {
    res.sendFile(__dirname + '/write.html');
});

app.post('/add', function (req, res) {
    res.send('전송완료')

    db.collection('counter').findOne({ name: '게시물갯수' },
        function (에러, 결과) {
            let 총게시물갯수 = 결과.totalPost;

            db.collection('post').insertOne({ _id: 총게시물갯수 +1, 제목: req.body.title, 날짜: req.body.date },
                function (에러, 결과) {
                    console.log('저장완료');
                    db.collection('counter').updateOne({name: '게시물갯수'},{ $inc: {totalPost:1} },function(에러, 결과){
                        if(에러){return console.log(에러)}
                    })
                });
        })
});

app.get('/list', function (req, res) {

    db.collection('post').find().toArray(function (에러, 결과) {
        console.log(결과);
        res.render('list.ejs', { posts: 결과 });
    });

});