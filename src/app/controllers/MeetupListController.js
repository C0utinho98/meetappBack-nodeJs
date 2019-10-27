import Meetup from '../models/Meetup';
import File from '../models/File';

class MeetupListController {
  async index(req, res) {
    const Metups = await Meetup.findAll({
      where: { user_id: req.userId },
      order: ['date'],
      include: [
        {
          model: File,
          as: 'File',
          attributes: ['path', 'name', 'url', 'id'],
        },
      ],
    });

    return res.json(Metups);
  }
}

export default new MeetupListController();
