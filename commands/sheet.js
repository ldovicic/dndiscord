const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { doc, getDoc } = require('firebase/firestore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sheet')
		.setDescription('Displays a character sheet.')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('Selects user whose sheet will be displayed.')),
	async execute(interaction) {
		const target = interaction.options.getUser('target') ?? interaction.user;
		const targetId = target.id;

		const docSnap = await getDoc(doc(interaction.client.db, 'users', targetId));

		if (docSnap.exists()) {
			const xpBounds = ['300', '900', '2700', '6500', '14000', '23000', '34000', '48000', '64000', '85000', '100000', '120000', '140000', '165000', '195000', '225000', '265000', '305000', '355000', '∞'];
			const sheetEmbed = new EmbedBuilder()
				.setColor(0x5e9cff)
				.setTitle(docSnap.data().charName)
				.setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
				.addFields(
					{ name: 'Current Level', value: docSnap.data().currentLvl.toString(), inline: true },
					{ name: 'XP', value: `${docSnap.data().currentXp}/${xpBounds[docSnap.data().currentLvl - 1]}`, inline: true },
					{ name: 'Available Level-Ups', value: `${docSnap.data().currentLvl - Object.values(docSnap.data().charClass).reduce((a, b) => a + b, 0)}`, inline: true },
					{ name: '\u200B', value: '\u200B' },
					{ name: 'Strength', value: docSnap.data().abilityScores.str.toString(), inline: true },
					{ name: 'Dexterity', value: docSnap.data().abilityScores.dex.toString(), inline: true },
					{ name: 'Constitution', value: docSnap.data().abilityScores.con.toString(), inline: true },
					{ name: 'Intelligence', value: docSnap.data().abilityScores.int.toString(), inline: true },
					{ name: 'Wisdom', value: docSnap.data().abilityScores.wis.toString(), inline: true },
					{ name: 'Charisma', value: docSnap.data().abilityScores.cha.toString(), inline: true },
					{ name: '\u200B', value: '\u200B' },
					{ name: 'HP', value: `${docSnap.data().currentHp}/${docSnap.data().maxHp}`, inline: true },
					{ name: 'Armor Class', value: (10 + Math.floor((docSnap.data().abilityScores.dex - 10) / 2)).toString(), inline: true },
					{ name: 'Gold', value: docSnap.data().currentGp.toString(), inline: true },
				);

			const description = [];
			for (const charClass in docSnap.data().charClass) {
				description.push(`${charClass.charAt(0).toUpperCase() + charClass.slice(1)}: ${docSnap.data().charClass[charClass]}`);
			}
			sheetEmbed.setDescription(`**${docSnap.data().charRace}** - *${description.join(', ')}*`);

			if (docSnap.data().avatarUrl) {
				sheetEmbed.setThumbnail(docSnap.data().avatarUrl);
			}

			await interaction.reply({
				embeds: [sheetEmbed],
			});
		}
		else {
			await interaction.reply({
				content: 'Selected user does not have a character sheet. Create one by using `/create`',
				ephemeral: true,
			});
		}
	},
};