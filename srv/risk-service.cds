
using {riskmanagement as rm} from '../db/schema';

@path: 'service/risk'
service RiskService @(requires: 'authenticated-user') {
    entity Risks @(restrict: [
        {
            grant: 'READ',
            to   : 'RiskViewer'
        },
        {
            grant: [
                'READ',
                'WRITE',
                'UPDATE',
                'UPSERT',
                'DELETE',
                'setRandomPriority'
            ], // Allowing CDS events by explicitly mentioning them
            to   : 'RiskManager'
        }
    ])                      as projection on rm.Risks
        actions {
            @(
                cds.odata.bindingparameter.name : '_it',
                Common.SideEffects.TargetEntities : [_it.prio]
            )
            action setRandomPriority() returns Risks;
        };
    annotate Risks with @cds.redirection.target;
    annotate Risks with @odata.draft.enabled;

    entity Mitigations @(restrict: [
        {
            grant: 'READ',
            to   : 'RiskViewer'
        },
        {
            grant: '*', // Allow everything using wildcard
            to   : 'RiskManager'
        }
    ])                      as projection on rm.Mitigations;
    annotate Mitigations with @odata.draft.enabled;

    @readonly entity ListOfRisks  as projection on rm.Risks {
        ID,
        title,
        owner
    };

    @readonly
    entity BusinessPartners as projection on rm.BusinessPartners;
}