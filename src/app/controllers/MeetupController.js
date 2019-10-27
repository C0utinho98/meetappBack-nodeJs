import * as Yup from 'yup';
import { Op } from 'sequelize';
import { isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      localization: Yup.string().required(),
      date: Yup.string().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Data invalida' });
    }

    const user_id = req.userId;
    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });
    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      localization: Yup.string().required(),
      date: Yup.string().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação' });
    }

    const user_id = req.userId;

    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== user_id) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Data invalida' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'Não é possível atualizar meetups que já passaram' });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const user_id = req.userId;
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== user_id) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'Não é possível excluir meetups que já passaram' });
    }

    await meetup.destroy();

    return res.send();
  }

  async index(req, res) {
    const { date } = req.query;
    const parsedDate = parseISO(date, 'YYYY-MM-DD');

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      include: [
        { model: File, as: 'File', attributes: ['path', 'name', 'url'] },
        { model: User, attributes: ['name', 'email'] },
      ],
      order: ['date'],
    });

    return res.json(meetups);
  }
}

export default new MeetupController();
