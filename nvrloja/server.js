const express = require('express');
const mercadopago = require('mercadopago');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure seu access token do Mercado Pago aqui
mercadopago.configure({
  access_token: 'SEU_ACCESS_TOKEN_AQUI'
});

app.post('/create_preference', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Itens do pedido são obrigatórios' });
    }

    const preference = {
      items,
      payment_methods: {
        excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }],
        installments: 1
      },
      back_urls: {
        success: 'http://localhost:3000/pagamento-sucesso.html',
        failure: 'http://localhost:3000/pagamento-falha.html',
        pending: 'http://localhost:3000/pagamento-pendente.html'
      },
      auto_return: 'approved',
      binary_mode: true
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({
      init_point: response.body.init_point,
      qr_code: response.body.point_of_interaction?.transaction_data?.qr_code_base64
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar preferência' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

