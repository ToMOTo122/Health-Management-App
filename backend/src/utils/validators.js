const { body } = require('express-validator');

const authValidation = {
  register: [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码至少 6 位'),
    body('nickname').trim().notEmpty().withMessage('昵称不能为空'),
  ],
  login: [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').notEmpty().withMessage('请输入密码'),
  ],
};

module.exports = authValidation;
