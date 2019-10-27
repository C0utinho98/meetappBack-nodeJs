import { Op } from 'sequelize';
import User from '../models/User';
import Meetup from '../models/Meetup';
import File from '../models/File';
import Subscription from '../models/Subscriptions';

import InscriptionMail from '../jobs/InscriptionMail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async store(req, res) {
    const meetupId = req.params.id;

    const meetup = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
      ],
    });
    const user = await User.findByPk(req.userId);
    if (user.id === meetup.user_id) {
      return res
        .status(400)
        .json({ error: 'Não é possível inscrever-se em Meetups próprios' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'Não é possível inscrever-se em Meetup que já passou' });
    }

    const alreadySub = await Subscription.findOne({
      where: {
        meetup_id: meetupId,
        user_id: user.id,
        canceled_at: { [Op.is]: null },
      },
    });

    if (alreadySub) {
      return res.status(400).json({
        error: 'Você não pode increver-se mais de uma vez no mesmo Meetup',
      });
    }

    const alreadySubsDay = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (alreadySubsDay) {
      return res.status(400).json({
        error:
          'Não é possível inscrever-se em 2 Meetups que ocorerão ao mesmo tempo',
      });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    await Queue.add(InscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }

  async delete(req, res) {
    const meetup_id = req.params.id;
    const user_id = req.userId;

    const subscription = await Subscription.findOne({
      where: {
        meetup_id,
        user_id,
      },
    });

    if (!subscription) {
      return res.status(400).json({ error: 'Meetup não encontrado!' });
    }

    subscription.canceled_at = new Date();
    await subscription.save();

    return res.status(200).send();
  }

  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.gte]: new Date(),
        },
      },
      include: [
        {
          model: File,
          as: 'File',
          attributes: ['path', 'name', 'url', 'id'],
        },
        {
          model: User,
          attributes: ['name', 'email', 'id'],
        },
        {
          model: Subscription,
          where: { canceled_at: { [Op.is]: null } },
        },
      ],
      order: ['date'],
    });

    return res.json(meetups);
  }
}

export default new SubscriptionController();
