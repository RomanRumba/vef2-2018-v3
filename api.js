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

function validateId(id) {
  if (isNaN(id)) { // eslint-disable-line
    return { error: 'Id has to be a whole number' };
  }
  // Ef notandi reynir að slá tölu lægri en 1 , id incrementation byrjar á 1 i pg
  if (parseInt(id, 10) < 1) {
    return { error: 'Id has to be a number that is bigger or equal to 1' };
  }
  // Ef notandi reynir að slá inn brotatölu þá er það bannað
  if (parseFloat(id) % 1 !== 0) {
    return { error: 'Id has to be a whole number that is bigger or equal to 1' };
  }
  return null;
}

/* Ef er spurt um rót, þá er kallað á fallið readAll()
   sem sækir öll rows úr gagnagruni og það er skila til notandans */
router.get('/', (req, res) => {
  readAll().then(data => {res.status(200).json(data);});
});

/* Ef stödd á rót og spurt um id
   þá er sótt Id og villu chekkað hana ef hun stends ekki við kröfu 
   það er skilað 400 villu með villu ástæðu 
   annars ef það er i lagi skilað 200 með json hlut sem hefur
   sama id sem aðili bað um */
router.get('/:id', (req, res) => {
  const { id } = req.params;// sækja id sem var slegið frá notenda
  // Ef notandi sló inn eitthvað sem er ekki tala
  const error = validateId(id);
  if (error !== null) {
    res.status(400).json(error);
  } else {
  // Ef það er komist hingað þá er amk leitarstrengur löglegur
  readOne(id).then(data => {
    // Ef það fæst tómt obj þá er nótan ekki til i pg 
    if (data.length === 0) {
      res.status(404).json({ error: 'Note not found' });
    } else {
    res.status(200).json(data);
    }
  });
  }
});

/* Ef stödd á rót og gerum post þá er athugað 
   hvort gögnin eru á löglegu formi ef þau eru ekki þá er
   skilað villu meldingunar með 400 kóða 
   annars þá er kallað 
 */
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
  create({ title, text, datetime }).then(data => { res.status(201).json(data);});
  }
});

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
  readOne(id).then(data => {
    // Ef það fæst tómt obj þá er nótan ekki til i pg 
    if (data.length === 0) {
      res.status(404).json({ error: 'id not found' });
    } else {
      const error = checkForErrors({ title, text, datetime });
      if (error.length > 0) {
        res.status(400).json(error);
      } else {
        update(id ,{ title, text, datetime }).then(data => { res.status(201).json(data);});
      }
    }
  });
}
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

 const error = validateId(id);
  if (error !== null){
    res.status(400).json(error);
  } else {
  readOne(id).then(data => {
    // Ef það fæst tómt obj þá er nótan ekki til i pg 
    if (data.length === 0) {
      res.status(404).json({ error: 'færsla er ekki til' });
    } else {
      del(id).then( res.status(204).json());
    }
  });
}
});

module.exports = router;
