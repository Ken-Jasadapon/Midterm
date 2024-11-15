const express = require('express');
const routes = express.Router();
const { createUser, loginUser, changePass, requestOTP,
    products, AddProducts, EditProducts, DeleteProducts, setNoti,
    carts, AddItemCart, EditItemCart, DeleteItemCart, ItemCart } = require('../controllers/controllers');
const { authenticate, authorization, otpReqLimiter } = require('../middleware/auth');

routes.post('/register', createUser);
routes.post('/login', authenticate, loginUser);
routes.post('/changePass', authenticate, authorization('admin', 'employee', 'customer'), changePass);
routes.post('/requestOTP', authenticate, otpReqLimiter, requestOTP);
routes.get('/products', authenticate, authorization('admin', 'employee', 'customer'), products);
routes.post('/products', authenticate, authorization('admin', 'employee'), AddProducts);
routes.put('/products/:ProId', authenticate, authorization('admin', 'employee'), EditProducts);
routes.delete('/products/:ProId', authenticate, authorization('admin', 'employee'), DeleteProducts);
routes.post('/setNotification', authenticate, setNoti);
routes.post('/carts', authenticate, carts);
routes.post('/carts/:cartId/items', authenticate, AddItemCart);
routes.put('/carts/:cartId/items/:itemId', authenticate, EditItemCart);
routes.delete('/carts/:cartId/items/:itemId', authenticate, DeleteItemCart);
routes.get('/carts/:cartId/item', authenticate, ItemCart);


module.exports = routes;