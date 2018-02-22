/* -----------------------------------------------------------------
   ------------------------Requires Start --------------------------
   ----------------------------------------------------------------- */

const express = require('express');
const validator = require('validator');
const {
  create,
  readAll,
  readOne,
  update,
  del,
} = require('./notes');// sækja öll föll úr notes til að geta tala við gagnagrun

/* -----------------------------------------------------------------
   ------------------------Requires END   --------------------------
   ----------------------------------------------------------------- */

const router = express.Router();

/* Notkun : checkForErrors({ title, text, datetime })
   Fyrir  : title er strengur ,
            text er strengur
            datetime er  ISO 8601 date snið
    Eftir : skilar error fylki sem er sett af villumeldingum fyrir
            breytur title,text,datetime */
function checkForErrors({ title, text, datetime }) {
  const error = [];
  if (title.length < 1 || title.length > 255) {
    error.push({ field: 'title', error: 'Title must be a string of length 1 to 255 characters' });
  }
  if (typeof text !== 'string') {
    error.push({ field: 'text', error: 'Text must be a string' });
  }
  if (!validator.isISO8601(datetime)) {
    error.push({ field: 'datetime', error: 'Datetime must be a ISO 8601 date' });
  }
  return error;
}

/* Notkun : validateId(id)
   Fyrir  : id er heiltala > 0
   Efitr  : skilar json obj sem er villu melding
            eða ekkert ef id er löglegt gildi */
function validateId(id) {
  if (isNaN(id)) { // eslint-disable-line
    return { error: 'Id has to be a whole number' };
  }
  if (parseInt(id, 10) < 1) {
    return { error: 'Id has to be a number that is bigger or equal to 1' };
  }
  if (parseFloat(id) % 1 !== 0) {
    return { error: 'Id has to be a whole number that is bigger or equal to 1' };
  }
  return null;
}

/* Ef það er sent GET á rót þá er lesið gögn af gangagruni
   og skilað það sem gagnagrunur skilar  */
router.get('/', (req, res) => {
  readAll().then((data) => { res.status(200).json(data); });
});

/* Ef er sent GET með parameter sem á að vera heiltala >0
   það er first athugað hvort id er löglegt inntak,
   svo athugað hvort Id er til,
   ef það er ekki til skila 404 villu með villumeldingu
   annars 200 með gögnum sem gagnagrunur skilar */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const error = validateId(id);
  if (error !== null) {
    res.status(400).json(error);
  } else {
    readOne(id).then((data) => {
      if (data.length === 0) {
        res.status(404).json({ error: 'Note not found' });
      } else {
        res.status(200).json(data);
      }
    });
  }
});

/* Ef það er sent POST þá þarf að athuga hvort gögnin eru á
   löglegu formi og ef þeir eru þá er þeim skráð i gagnagrun
   og skilað svo þeim sem json */
router.post('/', (req, res) => {
  const {
    datetime,
    text,
    title,
  } = req.body;
  const error = checkForErrors({ title, text, datetime });

  if (error.length > 0) {
    res.status(400).json(error);
  } else {
    create({ title, text, datetime }).then((data) => { res.status(201).json(data); });
  }
});

/* Ef það er sent PUT með heiltölu parameter
   það þarf fyrst að athuga hvort id er löglegt inntak
   svo hvort þetta id er til þá má validata gögn og
   ef það er lagi þá uppfæra notu id með nyjum gögnum */
router.put('/:id', (req, res) => {
  const { id } = req.params;

  const {
    datetime,
    text,
    title,
  } = req.body;

  const error = validateId(id);
  if (error !== null) {
    res.status(400).json(error);
  } else {
    readOne(id).then((data) => {
      if (data.length === 0) {
        res.status(404).json({ error: 'id not found' });
      } else {
        const errors = checkForErrors({ title, text, datetime });
        if (errors.length > 0) {
          res.status(400).json(errors);
        } else {
          update(id, { title, text, datetime }).then((Qresult) => {
            res.status(201).json(Qresult);
          });
        }
      }
    });
  }
});

/* EF það er sent DELETE með heiltölu parameter þá
   þarf að athuga hvort id er löglegt inntak svo
   þarf að athuga hvort þetta id er til og þá ef það er til
   þa þarf að eyða þvi */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const error = validateId(id);
  if (error !== null) {
    res.status(400).json(error);
  } else {
    readOne(id).then((data) => {
    // Ef það fæst tómt obj þá er nótan ekki til i pg
      if (data.length === 0) {
        res.status(404).json({ error: 'færsla er ekki til' });
      } else {
        del(id).then(res.status(204).json());
      }
    });
  }
});

module.exports = router;
