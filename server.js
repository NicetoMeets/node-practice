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

app.get('/list', function (req, res) {
    //디비에 저장된 post라는 콜렉션 안의 모든 데이터 꺼내기
    db.collection('post').find().toArray(function (에러, 결과) {
        console.log(결과);
        res.render('list.ejs', { posts: 결과 });
    });
});

app.get('/search', (req, res) => {

    var 검색조건 = [
        {
            $search: {
                index: 'TitleSearch',
                text: {
                    query: req.query.value,
                    path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
                }
            }
        },
        { $sort: { _id: 1 } },    //id 오름차순으로 결과 정렬
        { $limit: 10 },            //검색결과 맨위 10개만 가져옴
        { $project: { 제목: 1, _id: 1 } }    //검색결과중 원하는 항목만보여줌 제목만 가져옴
    ]
    console.log(req.query);
    db.collection('post').aggregate(검색조건).toArray((에러, 결과) => {
        console.log(결과)
        res.render('search.ejs', { posts: 결과 })
    })
})

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

app.get('/fail', function (req, res) {
    res.render('fail.ejs')
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

app.post('/register', function (req, res) {         //회원가입
    db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw }, function (에러, 결과) {
        res.redirect('/')
    })
});

app.post('/add', function (req, res) {
    res.redirect('/')

    db.collection('counter').findOne({ name: '게시물갯수' },
        function (에러, 결과) {
            let 총게시물갯수 = 결과.totalPost;

            let post = { _id: 총게시물갯수 + 1, 작성자: req.user._id, 제목: req.body.title, 날짜: req.body.date }

            db.collection('post').insertOne(post, function (에러, 결과) {
                console.log('저장완료');
                db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
                    if (에러) { return console.log(에러) }
                })
            });
        })
});

app.delete('/delete', function (req, res) {
    req.body._id = parseInt(req.body._id);

    let deleteData = { _id: req.body._id, 작성자: req.user._id }  //두조건이 일치하는 게시물 삭제

    //요청.body에 담겨온 게시물번호를 가진 글을 db에서 찿아서 삭제해주세요
    db.collection('post').deleteOne(deleteData, function (에러, 결과) {
        console.log('삭제완료');
        res.status(200).send('성공했습니다');
    })
});

app.get('/mypage', isLogin, function (req, res) {
    console.log(req.user)   //DB에 데이터가 이곳에 들어감
    res.render('mypage.ejs', { 사용자: req.user })
});

function isLogin(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.send('로그인안하셨습니다')
    }
};

let multer = require('multer');
let storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, './public/image')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)

    }
});

let upload = multer({ storage: storage });


app.get('/upload', function (req, res) {
    res.render('upload.ejs')
});


app.post('/upload', upload.single("profile"), function(req, res){
    res.redirect('/')
}); 
//input의 name 속성이름 '프로필' 데이터를 받아옴

app.get('/image/:imageName', function(req, res){
    res.sendFile( __dirname + '/public/image/' + req.params.imageName )
})