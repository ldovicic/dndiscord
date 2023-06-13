const { SlashCommandBuilder } = require('discord.js');
const { doc, getDoc, updateDoc } = require('firebase/firestore');

const getLevel = (xp) => {
	switch (true) {
	case (xp < 300):
		return 1;
	case (xp < 900):
		return 2;
	case (xp < 2700):
		return 3;
	case (xp < 6500):
		return 4;
	case (xp < 14000):
		return 5;
	case (xp < 23000):
		return 6;
	case (xp < 34000):
		return 7;
	case (xp < 48000):
		return 8;
	case (xp < 64000):
		return 9;
	case (xp < 85000):
		return 10;
	case (xp < 100000):
		return 11;
	case (xp < 120000):
		return 12;
	case (xp < 140000):
		return 13;
	case (xp < 165000):
		return 14;
	case (xp < 195000):
		return 15;
	case (xp < 225000):
		return 16;
	case (xp < 265000):
		return 17;
	case (xp < 305000):
		return 18;
	case (xp < 355000):
		return 19;
	default:
		return 20;
	}
};

const setLvlRole = (target, level) => {
	const roles = [
		'1070079703261651036',
		'1070079893871788163',
		'1070079896296112201',
		'1070079897369849858',
		'1070079898934312990',
		'1070079900192612473',
		'1070079901098594334',
		'1070079902403014706',
		'1070079903556456468',
		'1070079904495960115',
		'1070079905695531091',
		'1070079906710560859',
		'1070079908296016012',
		'1070079909554307212',
		'1070079910590296206',
		'1070079911500464148',
		'1070080220859744407',
		'1070080222810079295',
		'1070080224290684978',
		'1070080283308720191',
	];

	roles.forEach((roleId) => {
		target.guild.roles.fetch(roleId).then(role => {
			target.roles.remove(role);
		});
	});

	target.guild.roles.fetch(roles[level - 1]).then(addRole => {
		target.roles.add(addRole);
	});
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addxp')
		.setDescription('Adds XP to the specified user.')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('User to give XP to.')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('amount')
				.setDescription('Amount of XP to give to user.')
				.setRequired(true)),
	async execute(interaction) {
		if (interaction.member.roles.cache.has('1069977254123290624')) {
			const target = interaction.options.getMember('target');
			const targetId = target.id;
			let amount = Number(interaction.options.getString('amount'));

			const docRef = doc(interaction.client.db, 'users', targetId);
			const docSnap = await getDoc(docRef);

			if (!amount || amount <= 0) {
				await interaction.reply({ content: 'Invalid amount.', ephemeral: true });
			}
			else if (docSnap.exists()) {
				amount = Math.floor(amount);
				if (docSnap.data().currentXp + amount >= 0) {
					await updateDoc(docRef, {
						currentXp: docSnap.data().currentXp + amount,
						currentLvl: getLevel(docSnap.data().currentXp + amount),
					});
					await interaction.reply({ content: 'Successfully added XP.', ephemeral: true });
					if (getLevel(docSnap.data().currentXp + amount) > docSnap.data().currentLvl) {
						setLvlRole(target, getLevel(docSnap.data().currentXp + amount));
					}
				}
				else {
					await interaction.reply({ content: 'User does not have enough XP.', ephemeral: true });
				}
			}
			else {
				await interaction.reply({ content: 'User does not have a character sheet.', ephemeral: true });
			}
		}
		else {
			await interaction.reply({ content: 'You are not a DM.', ephemeral: true });
		}
	},
};