
using {riskmanagement as rm} from '../db/schema';

@path: 'service/risk'
service RiskService {
    entity Risks       as projection on rm.Risks
        actions {
            @(
                cds.odata.bindingparameter.name : '_it',
                Common.SideEffects.TargetEntities : [_it.prio]
            )
            action setRandomPriority() returns Risks;
        };
    annotate Risks with @cds.redirection.target;
    annotate Risks with @odata.draft.enabled;

    entity Mitigations as projection on rm.Mitigations;
    annotate Mitigations with @odata.draft.enabled;

    @readonly entity ListOfRisks  as projection on rm.Risks {
        ID,
        title,
        owner
    };

    // BusinessPartner will be used later
    //@readonly entity BusinessPartners as projection on rm.BusinessPartners;
}