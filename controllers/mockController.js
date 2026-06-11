// Mock data controller - serves sample data when MongoDB is unavailable
const express = require('express');
const router = express.Router();

// Mock data
const mockGroups = [
    { _id: '1', name: 'A', matches: 6 },
    { _id: '2', name: 'B', matches: 6 },
    { _id: '3', name: 'C', matches: 6 },
    { _id: '4', name: 'D', matches: 6 },
];

const mockTeams = [
    { _id: '1', id: '1', name_en: 'USA', name_fa: 'آمریکا', group: '1', flag: 'us' },
    { _id: '2', id: '2', name_en: 'Mexico', name_fa: 'مکزیک', group: '1', flag: 'mx' },
    { _id: '3', id: '3', name_en: 'Canada', name_fa: 'کانادا', group: '1', flag: 'ca' },
    { _id: '4', id: '4', name_en: 'Brazil', name_fa: 'برزیل', group: '2', flag: 'br' },
    { _id: '5', id: '5', name_en: 'Argentina', name_fa: 'آرژانتین', group: '2', flag: 'ar' },
    { _id: '6', id: '6', name_en: 'England', name_fa: 'انگلیس', group: '3', flag: 'gb-eng' },
    { _id: '7', id: '7', name_en: 'France', name_fa: 'فرانسه', group: '3', flag: 'fr' },
    { _id: '8', id: '8', name_en: 'Germany', name_fa: 'آلمان', group: '4', flag: 'de' },
    { _id: '9', id: '9', name_en: 'Spain', name_fa: 'اسپانیا', group: '4', flag: 'es' },
];

const mockGames = [
    {
        _id: '1',
        match_number: 1,
        group: 'A',
        match_date: '2026-06-11',
        match_time: '17:00',
        home_team_id: '1',
        home_team_name_en: 'USA',
        home_team_name_fa: 'آمریکا',
        away_team_id: '2',
        away_team_name_en: 'Mexico',
        away_team_name_fa: 'مکزیک',
        home_goals: null,
        away_goals: null,
        status: 'not_started',
        stadium: 'AT&T Stadium',
    },
    {
        _id: '2',
        match_number: 2,
        group: 'A',
        match_date: '2026-06-12',
        match_time: '20:00',
        home_team_id: '3',
        home_team_name_en: 'Canada',
        home_team_name_fa: 'کانادا',
        away_team_id: '4',
        away_team_name_en: 'Brazil',
        away_team_name_fa: 'برزیل',
        home_goals: null,
        away_goals: null,
        status: 'not_started',
        stadium: 'BMO Field',
    },
];

const mockStadiums = [
    {
        _id: '1',
        id: '1',
        name: "AT&T Stadium",
        city: 'Arlington, Texas',
        country: 'USA',
        capacity: 80000,
        latitude: 32.8975,
        longitude: -97.2037,
    },
    {
        _id: '2',
        id: '2',
        name: 'BMO Field',
        city: 'Toronto, Ontario',
        country: 'Canada',
        capacity: 45000,
        latitude: 43.6332,
        longitude: -79.4193,
    },
];

// Try to get real data, fallback to mock
async function tryGetTeams() {
    try {
        const Team = require('../models/team');
        return await Team.find({}).lean();
    } catch (err) {
        return mockTeams;
    }
}

async function tryGetGroups() {
    try {
        const Group = require('../models/group');
        return await Group.find().lean();
    } catch (err) {
        return mockGroups;
    }
}

async function tryGetGames() {
    try {
        const Game = require('../models/game');
        const games = await Game.find({}).lean();
        
        // Add team names from cache
        const teamMap = {};
        const teams = await tryGetTeams();
        teams.forEach(team => {
            teamMap[team.id] = {
                name_en: team.name_en,
                name_fa: team.name_fa,
            };
        });

        return games.map(game => {
            if (game.home_team_id && teamMap[game.home_team_id]) {
                game.home_team_name_en = teamMap[game.home_team_id].name_en;
                game.home_team_name_fa = teamMap[game.home_team_id].name_fa;
            }
            if (game.away_team_id && teamMap[game.away_team_id]) {
                game.away_team_name_en = teamMap[game.away_team_id].name_en;
                game.away_team_name_fa = teamMap[game.away_team_id].name_fa;
            }
            return game;
        });
    } catch (err) {
        return mockGames;
    }
}

async function tryGetStadiums() {
    try {
        const Stadium = require('../models/stadium');
        return await Stadium.find().lean();
    } catch (err) {
        return mockStadiums;
    }
}

// Routes
router.get('/groups', async (req, res) => {
    try {
        const groups = await tryGetGroups();
        return res.send({ groups });
    } catch (err) {
        return res.status(400).send({ error: 'Error getting groups' });
    }
});

router.get('/group', async (req, res) => {
    try {
        if (!req.query.name) {
            return res.status(400).send({ error: 'Error no query declared' });
        }
        const groups = await tryGetGroups();
        const group = groups.find(g => g.name === req.query.name);
        
        if (!group) {
            return res.status(400).send({ error: `Group ${req.query.name} not found` });
        }

        const teams = await tryGetTeams();
        const groupTeams = teams.filter(t => t.group === group._id.toString());

        return res.send({ group, teams: groupTeams });
    } catch (err) {
        return res.status(400).send({ error: `Error getting group: ${err.message}` });
    }
});

router.get('/teams', async (req, res) => {
    try {
        let teams = await tryGetTeams();
        
        if (req.query.group) {
            const groups = await tryGetGroups();
            const group = groups.find(g => g.name === req.query.group.toUpperCase());
            if (group) {
                teams = teams.filter(t => t.group === group._id.toString());
            }
        }
        
        return res.status(200).json({ teams });
    } catch (err) {
        return res.status(400).json({ error: 'Error getting teams', details: err.message });
    }
});

router.get('/team', async (req, res) => {
    try {
        if (!req.query.name) {
            return res.status(400).send({ error: 'Error no query declared' });
        }
        const teams = await tryGetTeams();
        const team = teams.find(t => t.name_en === req.query.name);
        
        if (!team) {
            return res.status(400).send({ error: `Team ${req.query.name} not found` });
        }

        return res.send({ team });
    } catch (err) {
        return res.status(400).send({ error: `Error getting team: ${err.message}` });
    }
});

router.get('/team/:idTeam', async (req, res) => {
    try {
        const teams = await tryGetTeams();
        const team = teams.find(t => t._id.toString() === req.params.idTeam);
        
        if (!team) {
            return res.status(400).send({ error: `Team not found` });
        }

        return res.send({ team });
    } catch (err) {
        return res.status(400).send({ error: `Error getting team: ${err.message}` });
    }
});

router.get('/games', async (req, res) => {
    try {
        const games = await tryGetGames();
        return res.send({ games });
    } catch (err) {
        return res.status(400).send({ error: 'Error getting games' });
    }
});

router.get('/game/:idGame', async (req, res) => {
    try {
        const games = await tryGetGames();
        const game = games.find(g => g._id.toString() === req.params.idGame);
        
        if (!game) {
            return res.status(400).send({ error: 'Game not found' });
        }

        return res.send({ game });
    } catch (err) {
        return res.status(400).send({ error: `Error getting game: ${err.message}` });
    }
});

router.get('/stadiums', async (req, res) => {
    try {
        const stadiums = await tryGetStadiums();
        return res.status(200).json({ stadiums });
    } catch (err) {
        return res.status(400).json({ error: 'Error getting stadiums', details: err.message });
    }
});

router.get('/stadium/:id', async (req, res) => {
    try {
        const stadiums = await tryGetStadiums();
        const stadium = stadiums.find(s => s.id === req.params.id);
        
        if (!stadium) {
            return res.status(404).json({ error: `Stadium not found with id: ${req.params.id}` });
        }

        return res.status(200).json({ stadium });
    } catch (err) {
        return res.status(400).json({ error: `Error getting stadium: ${err.message}` });
    }
});

module.exports = app => app.use('/get-mock', router);
