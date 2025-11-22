const express = require('express');
const router = express.Router();
const Contact = require('./model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

// POST /api/contact - Crear nuevo mensaje de contacto (público)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;

    // Validaciones
    if (!name || !email || !message) {
      return errorResponse(res, 'Nombre, email y mensaje son requeridos', 400);
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'El formato del email es inválido', 400);
    }

    // Crear mensaje
    const contact = new Contact({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      company: company?.trim() || '',
      message: message.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await contact.save();

    // Aquí podrías agregar envío de email de notificación
    // await sendNotificationEmail(contact);

    return successResponse(res, {
      id: contact._id
    }, 'Mensaje enviado correctamente. Te contactaremos pronto.');

  } catch (error) {
    console.error('Error al guardar mensaje de contacto:', error);
    return errorResponse(res, 'Error al enviar mensaje', 500);
  }
});

// GET /api/contact - Listar mensajes (requiere auth admin)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    return successResponse(res, {
      contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }, 'Mensajes obtenidos');

  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return errorResponse(res, 'Error al obtener mensajes', 500);
  }
});

// PATCH /api/contact/:id/status - Actualizar estado
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Estado inválido', 400);
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) {
      return errorResponse(res, 'Mensaje no encontrado', 404);
    }

    return successResponse(res, contact, 'Estado actualizado');

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return errorResponse(res, 'Error al actualizar estado', 500);
  }
});

module.exports = router;
