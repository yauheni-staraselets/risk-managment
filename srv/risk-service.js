// Import the cds facade object (https://cap.cloud.sap/docs/node.js/cds-facade)
const cds = require("@sap/cds");

// The service implementation with all service handlers
module.exports = cds.service.impl(async function () {
	// Define constants for the Risk and BusinessPartner entities from the risk-service.cds file
	const { Risks, Mitigations, BusinessPartners } = this.entities;

	// This handler will be executed directly AFTER a READ operation on RISKS
	// With this we can loop through the received data set and manipulate the single risk entries
	this.after("READ", Risks, async (data, req) => {
		// Convert to array, if it's only a single risk, so that the code won't break here
		const risks = Array.isArray(data) ? data : [data];

		const tx = this.transaction(req);
		const aMitigations = await tx.run(SELECT.from(Mitigations)),
			oMitigationsForFirstRisk = await tx.run(
				SELECT.from(Mitigations).where({ ID: risks[0].miti.ID })
			);

		// Looping through the array of risks to set the virtual field 'criticality' that you defined in the schema
		risks.forEach((risk) => {
			if (risk.impact >= 100000) {
				risk.criticality = 1;
			} else {
				risk.criticality = 2;
			}

			// set criticality for priority
			switch (risk.prio_code) {
				case "H":
					risk.PrioCriticality = 1;
					break;
				case "M":
					risk.PrioCriticality = 2;
					break;
				case "L":
					risk.PrioCriticality = 3;
					break;
				default:
					break;
			}
		});
	});

	this.before("setRandomPriority", async (req) => {
		const { impact } = await getRiskFromSubject(req);
		if (impact >= 100000) {
			req.error("IMPACT_ERROR_MESSAGE");
		}
	});

	this.on("setRandomPriority", async (req) => {
		const oCurrentRecord = await getRiskFromSubject(req),
			sRandomPriority = getRandomPriority(oCurrentRecord.prio_code);

		const iAffectedRowsNumber = await this.transaction(req).run(
			UPDATE(req.subject).set({
				prio_code: sRandomPriority,
			})
		);

		if (iAffectedRowsNumber === 0) {
			req.error(404, "RISK_NOT_FOUND");
		} else {
			return await getRiskFromSubject(req);
		}
	});

	getRiskFromSubject = async (req) => {
		const tx = this.transaction(req);
		return await tx.run(SELECT.one.from(req.subject));
	};

	getRandomPriority = (sCurrentPrio) => {
		const aPriorities = ["H", "M", "L"];
		let iNewIndex;

		do {
			iNewIndex = Math.floor(Math.random() * aPriorities.length);
		} while (aPriorities[iNewIndex] === sCurrentPrio);

		return aPriorities[iNewIndex];
	};
});
