//process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');

chai.use(chaiHttp);

  /*
  * Test the /GET routes
  */
  describe('/GET list', () => {
      it('it should GET all the nft of the creator', (done) => {
        chai.request(server)
            .get('/api/list')
            .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
              done();
            });
      });
  });


  describe('/GET collection', () => {
    it('it should GET all the nft of the creator', (done) => {
      chai.request(server)
          .get('/api/collection')
          .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
            done();
          });
    });
});
  /*
  * Test the /POST routes
  */
  describe('/POST book', () => {
      it('it should not POST a book without pages field', (done) => {
          let book = {
              title: "The Lord of the Rings",
              author: "J.R.R. Tolkien",
              year: 1954
          }
        chai.request(server)
            .post('/book')
            .send(book)
            .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('errors');
               done();
            });
      });

  });
