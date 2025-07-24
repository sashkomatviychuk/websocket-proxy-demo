// @ts-check
import express from 'express';

import { createUserId } from './services/user.service.mjs';

export const routes = express.Router();

routes.get('/', (req, res) => {
  // @ts-ignore
  if (!req.session?.userId) {
    return res.redirect('/login');
  }

  res.render('index', {});
});

routes.get('/login', (req, res) => {
  // @ts-ignore
  if (req.session?.userId) {
    return res.redirect('/');
  }

  res.render('login', {});
});

routes.post('/login', (req, res) => {
  const { name, password } = req.body;

  if (name && password) {
    // @ts-ignore
    req.session.userId = createUserId();
    return res.redirect('/');
  }

  res.redirect('/login');
});

routes.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).send('Internal Server Error');
    }

    res.redirect('/login');
  });
});
