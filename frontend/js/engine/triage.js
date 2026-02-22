/* ===== Rule-Based Triage Engine ===== */
let triageRules = null;
let firstAidData = null;

const TriageEngine = {
    async init() {
        if (!triageRules) {
            const res = await fetch('./data/rules.json');
            const data = await res.json();
            triageRules = data.rules;
        }
        if (!firstAidData) {
            const res = await fetch('./data/firstaid.json');
            const data = await res.json();
            firstAidData = data.instructions;
        }
    },

    /**
     * Evaluate matched symptoms against triage rules.
     * @param {Array} symptoms - Array of symptom objects from SymptomEngine
     * @returns {Object} - { urgency, matchedRule, actions, firstAid, description }
     */
    evaluate(symptoms) {
        if (!triageRules || symptoms.length === 0) {
            return {
                urgency: 'UNKNOWN',
                matchedRule: null,
                actions: ['Please describe your symptoms clearly and try again.'],
                firstAid: null,
                description: 'No symptoms were detected. Please try again with more detail.'
            };
        }

        const symptomIds = new Set(symptoms.map(s => s.id));
        let bestMatch = null;
        let bestUrgency = 'LOW';
        const urgencyPriority = { 'EMERGENCY': 0, 'URGENT': 1, 'MODERATE': 2, 'LOW': 3 };

        for (const rule of triageRules) {
            const isMatch = this._matchRule(rule.conditions, symptomIds);

            if (isMatch) {
                const rulePriority = urgencyPriority[rule.urgency] ?? 3;
                const bestPriority = urgencyPriority[bestUrgency] ?? 3;

                if (rulePriority < bestPriority) {
                    bestUrgency = rule.urgency;
                    bestMatch = rule;
                }
            }
        }

        // If no specific rule matched, use severity-based fallback
        if (!bestMatch) {
            const highestSeverity = symptoms[0]?.severity;
            if (highestSeverity === 'critical') {
                bestUrgency = 'EMERGENCY';
            } else if (highestSeverity === 'high') {
                bestUrgency = 'URGENT';
            } else if (highestSeverity === 'medium') {
                bestUrgency = 'MODERATE';
            } else {
                bestUrgency = 'LOW';
            }

            // Use the R029 (general) rule as fallback
            bestMatch = triageRules.find(r => r.id === 'R029') || {
                name: 'General Assessment',
                actions: ['Monitor symptoms', 'Rest and stay hydrated', 'See a doctor if symptoms worsen'],
                firstAidRef: 'general_care',
                description: 'Based on the symptoms described, general care is recommended.'
            };
        }

        // Get first aid instructions
        const firstAid = firstAidData?.[bestMatch.firstAidRef] || null;

        return {
            urgency: bestUrgency,
            matchedRule: bestMatch,
            actions: bestMatch.actions,
            firstAid: firstAid,
            description: bestMatch.description
        };
    },

    /**
     * Match a rule's conditions against detected symptom IDs.
     * Conditions have: 
     *   - "any": at least one must match
     *   - "with": all must match (optional, combined with "any")
     */
    _matchRule(conditions, symptomIds) {
        // Check "any" condition - at least one symptom should match
        const anyMatch = conditions.any?.some(id => symptomIds.has(id));
        if (!anyMatch) return false;

        // Check "with" condition - all symptoms must also be present
        if (conditions.with) {
            const withMatch = conditions.with.every(id => symptomIds.has(id));
            if (!withMatch) return false;
        }

        return true;
    },

    /**
     * Get urgency display info.
     */
    getUrgencyInfo(urgency) {
        const info = {
            EMERGENCY: {
                icon: '🚨',
                color: 'emergency',
                label: 'Emergency',
                message: 'Seek immediate medical help. Call 108 NOW.'
            },
            URGENT: {
                icon: '⚠️',
                color: 'urgent',
                label: 'Urgent',
                message: 'Medical attention needed soon. Visit a doctor within hours.'
            },
            MODERATE: {
                icon: '🔶',
                color: 'moderate',
                label: 'Moderate',
                message: 'Monitor closely. Visit a doctor within 24 hours.'
            },
            LOW: {
                icon: '✅',
                color: 'low',
                label: 'Low Risk',
                message: 'Home care is likely sufficient. Monitor for changes.'
            },
            UNKNOWN: {
                icon: '❓',
                color: 'moderate',
                label: 'Unknown',
                message: 'Could not determine urgency. Please describe symptoms in detail.'
            }
        };
        return info[urgency] || info.UNKNOWN;
    }
};
