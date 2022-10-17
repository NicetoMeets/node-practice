const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));


const MongoClient = require('mongodb').MongoClient;

let db;
MongoClient.connect('mongodb+srv://puma1800:ghfkddl7@cluster0.soieyzo.mongodb.net/?retryWrites=true&w=majority',
    function (에러, client) {
        if (에러) return console.log(에러);

        db = client.db('nodeapp');

        app.listen('1215', function () {
            console.log('listening on 1215')
        })
    });

app.get('/', function (req, res) {
    res.render('index.ejs');
});

app.get('/write', function (req, res) {
    res.render('write.ejs');
});

app.post('/add', function (req, res) {
    res.send('전송완료')

    db.collection('counter').findOne({ name: '게시물갯수' },
        function (에러, 결과) {
            let 총게시물갯수 = 결과.totalPost;

            db.collection('post').insertOne({ _id: 총게시물갯수 + 1, 제목: req.body.title, 날짜: req.body.date },
                function (에러, 결과) {
                    console.log('저장완료');
                    db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
                        if (에러) { return console.log(에러) }
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

app.delete('/delete', function (req, res) {
    //DB에서 글 삭제
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, function (에러, 결과) {
        console.log('삭제완료');
        res.status(200).send('성공했습니다');
    })
});

app.get('/detail/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (에러, 결과) {
        console.log(결과);
        res.render('detail.ejs', { data: 결과 });
    })
});

app.get('/edit/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (에러, 결과) {
        console.log(결과);
        res.render('edit.ejs', { post: 결과 });
    })
});

app.put('/edit', function (req, res) {
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { 제목: req.body.title, 날짜: req.body.date } },
        function (에러, 결과) {
            console.log('수정완료')
            res.redirect('/list')
        })
});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.get('/login', function (req, res) {
    res.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (req, res) {
    res.redirect('/')
});

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러)

        if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
        if (입력한비번 == 결과.pw) {
            return done(null, 결과)
        } else {
            return done(null, false, { message: '비번틀렸어요' })
        }
    })
}));

passport.serializeUser(function (user, done) {      //유저의 id 데이터를 바탕으로 세션데이터를 만들어주고 세션의 아이디를 쿠키로 만들어 브라우저로 보냄 
    done(null, user.id) 
});

passport.deserializeUser(function (아이디, done) {      //세션 아이디를 바탕으로 유저의 정보를 DB에서 찿아줌
    db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
        done(null, 결과)
    })
}); 

app.get('/mypage', isLogin ,function(req, res){
    console.log(req.user)   //DB에 데이터가 이곳에 들어감
    res.render('mypage.ejs', {사용자 : req.user})
})

function isLogin(req, res, next){
    if (req.user){
        next()
    } else {
        res.send('로그인안하셨습니다')
    }
}