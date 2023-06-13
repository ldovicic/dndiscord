const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputBuilder, ModalBuilder, TextInputStyle, InteractionCollector, InteractionType, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const { doc, getDoc, setDoc } = require('firebase/firestore');

const charInfo = {};


// creates buttons with class names
const classButtonBuilder = (row, className) => {
	row.addComponents(
		new ButtonBuilder()
			.setCustomId(className)
			.setLabel(className)
			.setStyle(ButtonStyle.Primary),
	);
};

// initiates class selectors
const classSelector = async (interaction) => {
	const classes = ['Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
	const rows = [];

	// dynamically creates rows of classes (due to discord limiting buttons to 5 per row)
	let classRow = new ActionRowBuilder();
	for (let i = 0; i < classes.length; i++) {
		classButtonBuilder(classRow, classes[i]);
		if (i % 5 === 4 || i + 1 === classes.length) {
			rows.push(classRow);
			classRow = new ActionRowBuilder;
		}
	}

	// replies with choices
	await interaction.reply({
		content: 'Choose your class:',
		ephemeral: true,
		components: rows,
	});

	// initiates interaction collector
	const classCollector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, max: 1 });

	classCollector.on('collect', async (i) => {
		if (!classes.includes(i.customId)) return;
		// creates yes/no buttons
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('confirmClass')
					.setLabel('Yes')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('retryClass')
					.setLabel('No')
					.setStyle(ButtonStyle.Danger),
			);

		// updates the msg with confirmation ? and replaces buttons
		await interaction.deleteReply();
		await i.reply({
			content: `You have chosen **${i.customId}**. Is that correct?`,
			ephemeral: true,
			components: [row],
		});

		charInfo.charClass = {};
		charInfo.charClass[i.customId.toLowerCase()] = 1;

		classConfirm(i);
	});
};

const classConfirm = (interaction) => {
	// collects button click interaction and responds accordingly
	const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, max: 1 });

	collector.on('collect', async (i) => {
		if (i.customId === 'confirmClass') {
			await interaction.deleteReply();
			raceSelector(i);
		}
		else if (i.customId === 'retryClass') {
			await interaction.deleteReply();
			classSelector(i);
		}
	});
};

const raceSelector = async (interaction) => {
	// creates race selection modal (text input)
	const raceModal = new ModalBuilder()
		.setCustomId('raceModal')
		.setTitle('Race selector');

	const raceInput = new TextInputBuilder()
		.setCustomId('raceInput')
		.setLabel('Choose your race:')
		.setStyle(TextInputStyle.Short);

	const row = new ActionRowBuilder().addComponents(raceInput);

	raceModal.addComponents(row);

	await interaction.showModal(raceModal);

	const collector = new InteractionCollector(interaction.client, { channel: interaction.channel, interactionType: InteractionType.ModalSubmit, max: 1, time: 60000 });

	collector.on('collect', async (i) => {
		const raceRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('confirmRace')
					.setLabel('Yes')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('retryRace')
					.setLabel('No')
					.setStyle(ButtonStyle.Danger),
			);

		charInfo.charRace = i.fields.getTextInputValue('raceInput');

		await i.reply({
			content: `You have chosen **${charInfo.charRace}**. Is that correct?`,
			ephemeral: true,
			components: [raceRow],
		});

		raceConfirm(i);
	});
};

const raceConfirm = (interaction) => {
	// same as classConfirm
	const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, max: 1 });

	collector.on('collect', async (i) => {
		if (i.customId === 'confirmRace') {
			await interaction.deleteReply();
			rollPrompt(i);
		}
		else if (i.customId === 'retryRace') {
			await interaction.deleteReply();
			raceSelector(i);
		}
	});
};

const rollPrompt = async (interaction) => {
	// roll auto/manually + handles reaction collecting
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('rollStats')
				.setLabel('Roll stats')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId('arrayStats')
				.setLabel('Standard array')
				.setStyle(ButtonStyle.Primary),
			// new ButtonBuilder()
			// 	.setCustomId('manualStats')
			// 	.setLabel('Enter stats manually')
			// 	.setStyle(ButtonStyle.Primary),
		);

	await interaction.reply({
		content: `You have successfully chosen **${charInfo.charRace}**. Do you want to roll for stats or use the standard array?`,
		ephemeral: true,
		components: [row],
	});

	const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, max: 1 });

	collector.on('collect', async (i) => {
		await interaction.deleteReply();
		if (i.customId === 'rollStats') {
			rollStats(i);
		}
		else if (i.customId === 'arrayStats') {
			arrayStats(i);
		}
		// else if (i.customId === 'manualStats') {
		// 	manualStats1(i);
		// }
	});
};

const rollStats = async (interaction) => {
	// rolls 6 stats and displays results
	const stats = [];
	for (let i = 0; i < 6; i++) {
		const stat = [];
		for (let j = 0; j < 4; j++) {
			stat.push((getRandomInt(6) + 1));
		}
		stats.push(stat);
	}

	const statTotals = stats.map(numbers => numbers.reduce((sum, num) => sum + num) - Math.min(...numbers));

	for (let i = 0; i < 6; i++) {
		let min = Math.min(...stats[i]);
		for (let j = 0; j < 4; j++) {
			if (stats[i][j] == min) {
				stats[i][j] = `${stats[i][j]}`;
				min = 0;
			}
			else {
				stats[i][j] = `**${stats[i][j]}**`;
			}
		}
	}

	await interaction.reply({
		embeds: [createStatEmbed(stats, statTotals)],
		ephemeral: true,
		components: [new ActionRowBuilder()
			.addComponents(
				// new ButtonBuilder()
				// 	.setCustomId('rerollStats')
				// 	.setLabel('Reroll')
				// 	.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('confirmStats')
					.setLabel('Confirm')
					.setStyle(ButtonStyle.Success),
			)],
	});

	charInfo.charStats = statTotals.sort((a, b) => a - b);
	rollConfirm(interaction);
};

const arrayStats = async (interaction) => {
	charInfo.charStats = [8, 10, 12, 13, 14, 15];
	statAllocation(interaction);
};

// const manualStats1 = async (interaction) => {
// 	const customIds = ['strength', 'dexterity', 'constitution'];
// 	const rows = [];

// 	for (const id of customIds) {
// 		const row = new ActionRowBuilder();
// 		const selectMenu = new StringSelectMenuBuilder()
// 			.setCustomId(id)
// 			.setPlaceholder(id);

// 		for (let i = 3; i < 19; i++) {
// 			selectMenu.addOptions(
// 				{
// 					label: i.toString(),
// 					value: i.toString(),
// 				},
// 			);
// 		}
// 		row.addComponents(selectMenu);
// 		rows.push(row);
// 	}

// 	rows.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('continueStats').setLabel('Continue').setStyle(ButtonStyle.Primary)));

// 	await interaction.reply({
// 		content: 'Using **10** for empty fields.',
// 		ephemeral: true,
// 		components: rows,
// 	});

// 	const filter = (i) => {
// 		return i.user.id === interaction.user.id;
// 	};

// 	const collector = interaction.channel.createMessageComponentCollector({ filter });

// 	collector.on('collect', async (i) => {
// 		if (i.customId === 'strength') {
// 			charInfo.abilityScores.str = Number(i.values[0]);
// 			await i.deferUpdate();
// 		}
// 		else if (i.customId === 'dexterity') {
// 			charInfo.abilityScores.dex = Number(i.values[0]);
// 			await i.deferUpdate();
// 		}
// 		else if (i.customId === 'constitution') {
// 			charInfo.abilityScores.con = Number(i.values[0]);
// 			await i.deferUpdate();
// 		}
// 		else if (i.customId === 'continueStats') {
// 			collector.stop();
// 			await interaction.deleteReply();
// 			if (!('str' in charInfo.abilityScores)) {
// 				charInfo.abilityScores.str = 10;
// 			}
// 			if (!('dex' in charInfo.abilityScores)) {
// 				charInfo.abilityScores.dex = 10;
// 			}
// 			if (!('con' in charInfo.abilityScores)) {
// 				charInfo.abilityScores.con = 10;
// 			}
// 			manualStats2(i);
// 		}
// 	});
// };

// const manualStats2 = async (interaction) => {
// 	const customIds = ['intelligence', 'wisdom', 'charisma'];
// 	const rows = [];

// 	for (const id of customIds) {
// 		const row = new ActionRowBuilder();
// 		const selectMenu = new StringSelectMenuBuilder()
// 			.setCustomId(id)
// 			.setPlaceholder(id);

// 		for (let i = 3; i < 19; i++) {
// 			selectMenu.addOptions(
// 				{
// 					label: i.toString(),
// 					value: i.toString(),
// 				},
// 			);
// 		}
// 		row.addComponents(selectMenu);
// 		rows.push(row);
// 	}

// 	rows.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('finishStats').setLabel('Finish').setStyle(ButtonStyle.Primary)));

// 	await interaction.reply({
// 		content: 'Using **10** for empty fields.',
// 		ephemeral: true,
// 		components: rows,
// 	});

// 	const filter = (i) => {
// 		return i.user.id === interaction.user.id;
// 	};

// 	const collector = interaction.channel.createMessageComponentCollector({ filter });

// 	collector.on('collect', async (i) => {
// 		if (i.customId === 'intelligence') {
// 			charInfo.abilityScores.int = Number(i.values[0]);
// 			await i.deferUpdate();
// 		}
// 		else if (i.customId === 'wisdom') {
// 			charInfo.abilityScores.wis = Number(i.values[0]);
// 			await i.deferUpdate();
// 		}
// 		else if (i.customId === 'charisma') {
// 			charInfo.abilityScores.cha = Number(i.values[0]);
// 			await i.deferUpdate();
// 		}
// 		else if (i.customId === 'finishStats') {
// 			collector.stop();
// 			await interaction.deleteReply();
// 			if (!('int' in charInfo.abilityScores)) {
// 				charInfo.abilityScores.int = 10;
// 			}
// 			if (!('wis' in charInfo.abilityScores)) {
// 				charInfo.abilityScores.wis = 10;
// 			}
// 			if (!('cha' in charInfo.abilityScores)) {
// 				charInfo.abilityScores.cha = 10;
// 			}
// 			charConfirm(i);
// 		}
// 	});
// };

const rollConfirm = async (interaction) => {
	const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, max: 1 });

	collector.on('collect', async (i) => {
		if (i.customId === 'rerollStats') {
			await interaction.deleteReply();
			rollStats(i);
		}
		else if (i.customId === 'confirmStats') {
			await interaction.deleteReply();
			statAllocation(i);
		}
	});
};

const statAllocation = async (interaction) => {
	let interactionBuffer = interaction;
	for (const stat of ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']) {
		statAllocStep(interactionBuffer, stat);
		await interactionBuffer.channel.awaitMessageComponent().then(i => {
			interactionBuffer.deleteReply();
			interactionBuffer = i;
			charInfo.abilityScores[(stat.slice(0, 3))] = Number(i.values[0]);
			charInfo.charStats.splice(charInfo.charStats.indexOf(Number(i.values[0])), 1);
		}).catch(console.error);
	}
	charConfirm(interactionBuffer);
};

const statAllocStep = async (interaction, statName) => {
	const row = new ActionRowBuilder();
	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId(statName)
		.setPlaceholder(statName);

	for (const stat of [...new Set(charInfo.charStats)]) {
		selectMenu.addOptions(
			{
				label: stat.toString(),
				value: stat.toString(),
			},
		);
	}

	row.addComponents(selectMenu);

	await interaction.reply({
		content: 'Once you select a value, it **cannot** be changed.',
		ephemeral: true,
		components: [row],
	});
};

const charConfirm = async (interaction) => {
	await interaction.reply({
		content: 'Character successfully created.',
		ephemeral: true,
	});

	charInfo.currentGp = 0;
	charInfo.currentLvl = 1;
	charInfo.currentXp = 0;

	if (Object.hasOwn(charInfo.charClass, 'barbarian')) {
		charInfo.maxHp = 12;
	}
	else if (Object.hasOwn(charInfo.charClass, 'fighter') || Object.hasOwn(charInfo.charClass, 'paladin') || Object.hasOwn(charInfo.charClass, 'ranger')) {
		charInfo.maxHp = 10;
	}
	else if (Object.hasOwn(charInfo.charClass, 'sorcerer') || Object.hasOwn(charInfo.charClass, 'wizard')) {
		charInfo.maxHp = 6;
	}
	else {
		charInfo.maxHp = 8;
	}

	charInfo.maxHp += Math.floor((charInfo.abilityScores.con - 10) / 2);
	charInfo.currentHp = charInfo.maxHp;

	await setDoc(doc(interaction.client.db, 'users', interaction.user.id), charInfo);

	interaction.guild.roles.fetch('1070079703261651036').then(addRole => {
		interaction.member.roles.add(addRole);
	});
};

const getRandomInt = (max) => {
	return Math.floor(Math.random() * max);
};

const createStatEmbed = (stats, statTotals) => {
	const statEmbed = new EmbedBuilder()
		.setColor(0x32a852)
		.setTitle('Rolled stats');

	for (let i = 0; i < 6; i++) {
		statEmbed.addFields(
			{ name: `Stat #${i + 1}`, value: `${stats[i].join(' + ')} = ${statTotals[i]}` },
		);
	}

	return statEmbed;
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create')
		.setDescription('Creates a new character sheet.')
		.addStringOption(option =>
			option
				.setName('charname')
				.setDescription('Sets the character name.')
				.setRequired(true)),
	async execute(interaction) {
		const docSnap = await getDoc(doc(interaction.client.db, 'users', interaction.user.id));
		if (docSnap.exists()) {
			return await interaction.reply({
				content: 'You already have a character sheet! View it by using `/sheet`.',
				ephemeral: true,
			});
		}
		charInfo.charName = interaction.options.getString('charname');
		charInfo.abilityScores = {};
		classSelector(interaction);
	},
};