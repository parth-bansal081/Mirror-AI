import { AnnaSDK } from '../anna';

export function createMockAnna(): AnnaSDK {
  return {
    storage: {
      get: async (params) => {
        const val = localStorage.getItem(params.key);
        return { value: val };
      },
      set: async (params) => {
        localStorage.setItem(params.key, params.value);
      },
      delete: async (params) => {
        localStorage.removeItem(params.key);
      },
    },
    window: {
      ready: async () => {},
      set_title: async () => {},
      resize: async () => {},
      close: async () => {},
    },
    chat: {
      write_message: async (params) => {
        console.log('[mock-chat] Message written:', params);
      },
    },
    tools: {
      list: async () => {
        return {
          tools: [
            { tool_id: 'mirror-prompt-analyzer', display_name: 'Prompt Archaeology' },
            { tool_id: 'mirror-decision-critic', display_name: "Devil's Advocate" },
            { tool_id: 'mirror-agent-supervisor', display_name: 'Agent Babysitter' },
            { tool_id: 'bundled:project-genesis', display_name: 'Project Genesis' },
          ],
        };
      },
      invoke: async (params) => {
        const { tool_id, method, args } = params;
        console.log(`[mock-sdk] Invoking tool: ${tool_id}, method: ${method}, args:`, args);

        // Simulate analysis latency
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (tool_id.includes('prompt-analyzer')) {
          const sub_scores = { clarity: 65, specificity: 40, context: 25, format_guidance: 10 };
          const integrity_score = 35;
          return {
            success: true,
            data: {
              failure_type: 'vague_instruction',
              failure_explanation: 'The prompt lacks clear format guidelines and constraints, leading the model to assume default styling and structures that did not match your goals.',
              integrity_score,
              sub_scores,
              diagnosis_summary: "Your prompt scored 35/100 — primarily failing on context and format guidance. The AI had to guess both what you needed and how to present it.",
              assumptions: [
                {
                  assumption: 'Assumed generic standard HTML structure without a component framework.',
                  reality: 'User wanted a customized React component using CSS modules.',
                  impact: 'The model generated raw HTML and vanilla CSS styled globally.'
                },
                {
                  assumption: 'Assumed default browser fonts and plain layouts were acceptable.',
                  reality: 'User wanted Space Grotesk/Inter and sleek glassmorphism panels.',
                  impact: 'The UI felt uninspired and lacked a premium visual aesthetic.'
                },
                {
                  assumption: 'Assumed standard form actions without modern UI validations.',
                  reality: 'User expected inline checkmarks and strict input validations.',
                  impact: 'The user could submit empty input fields.'
                }
              ],
              rewrites: [
                {
                  id: 'A',
                  strategy: 'Format-First',
                  fixes: ['format_guidance', 'specificity'],
                  rewritten_prompt: 'You are a senior frontend engineer. Output a modern, accessible React component. Use pure CSS modules with var() design tokens. No inline styles. Avoid default browser elements; build custom stylized controls with smooth transition effects.',
                  predicted_output: 'The model will output a clean React component using CSS modules and modern styles, preventing generic look and feel.'
                },
                {
                  id: 'B',
                  strategy: 'Context-First',
                  fixes: ['context', 'clarity'],
                  rewritten_prompt: 'Given this prompt: [Prompt], here is the expected structure: [Structure]. Now format the following query in the same structure: [Query]',
                  predicted_output: 'The model will adhere strictly to the target JSON/HTML structures, avoiding format drift.'
                },
                {
                  id: 'C',
                  strategy: 'Constraint-First',
                  fixes: ['specificity', 'format_guidance'],
                  rewritten_prompt: 'Before returning the response, verify against this checklist: 1. No CDN imports 2. WCAG AA contrast ratio 3. Proper aria labels. Highlight any violations in a comment.',
                  predicted_output: 'The model will run a self-check step, increasing compliance with project standards.'
                }
              ],
              pattern_warning: 'You\'ve had this same failure type (Vague Instruction) 3 times. Consider adding format constraints to all your prompts by default.'
            }
          };
        }

        if (tool_id.includes('decision-critic')) {
          return {
            success: true,
            data: {
              decision_type: 'technical',
              challenges: [
                {
                  id: 'c1',
                  type: 'opposition',
                  title: 'State De-synchronization Risk',
                  content: 'Relying purely on frontend memory for synchronization could cause state issues if the tab is reloaded mid-step.',
                  blind_spot_category: 'technical_scalability',
                  mark: 'unreviewed'
                },
                {
                  id: 'c2',
                  type: 'blind_spot',
                  title: 'Lack of Rollback Safeguards',
                  content: 'If a step fails halfway through, there is no automatic rollback, leaving the system in an inconsistent state.',
                  blind_spot_category: 'reversibility_ignored',
                  mark: 'unreviewed'
                },
                {
                  id: 'c3',
                  type: 'stress_test',
                  title: 'Direct Dependency Coupling',
                  content: 'Hardcoding the API paths directly makes it difficult to mock or redirect requests during dev/test phases.',
                  blind_spot_category: null,
                  mark: 'unreviewed'
                },
                {
                  id: 'c4',
                  type: 'blind_spot',
                  title: 'Session Hijack Vulnerability',
                  content: 'Exposing raw session IDs in window parameters without token validation allows session spoofing.',
                  blind_spot_category: 'timeline_risk',
                  mark: 'unreviewed'
                },
                {
                  id: 'c5',
                  type: 'historical',
                  title: 'Past Database Layover Overhead',
                  content: 'Previous schema migrations applied without safe triggers delayed deployment. We should double check if the current layout is robust.',
                  blind_spot_category: 'tech_debt',
                  mark: 'unreviewed'
                }
              ],
              counter_questions: [
                "What specific metric will indicate that the modular monolith is no longer viable?",
                "How will we handle distributed transaction rollbacks across microservices?",
                "Has the team done a cost-benefit analysis of cloud infrastructure overhead?",
                "Can we achieve the same boundaries by using separate packages in one repo?",
                "What is our plan for debugging cascading network errors in production?"
              ]
            }
          };
        }

        if (tool_id.includes('learning-path')) {
          if (method === 'generate_questions') {
            const topic = args.topic as string;
            return {
              success: true,
              data: {
                questions: [
                  `What problem does ${topic} solve that Docker alone doesn't?`,
                  `What's the difference between a Pod and a Container in ${topic}?`,
                  `How does ${topic} decide which node to schedule a Pod on?`,
                  `What happens to traffic when you do a rolling deployment in ${topic}?`,
                  `When would you use a StatefulSet instead of a Deployment in ${topic}?`
                ]
              }
            };
          }
          if (method === 'assess_baseline') {
            return {
              success: true,
              data: {
                level: 'intermediate',
                what_they_know: [
                  "Understands containerization principles.",
                  "Familiar with basic Pod definitions."
                ],
                what_they_dont_know: [
                  "Unclear on StatefulSets vs Deployments scheduling.",
                  "Needs practice with rolling updates networking."
                ]
              }
            };
          }
          if (method === 'generate_curriculum') {
            const topic = args.topic as string;
            return {
              success: true,
              data: {
                level: 'Intermediate → Production-Ready',
                goal: args.goal ?? 'Job Interview Prep',
                estimated_time: '3 weeks',
                weeks: [
                  {
                    week: 1,
                    title: 'CORE CONCEPTS',
                    topics: [
                      { title: 'Pods, Deployments, Services', known: true, key: 'pods' },
                      { title: 'ConfigMaps & Secrets', known: false, key: 'configmaps' },
                      { title: 'Namespaces & Resource Limits', known: false, key: 'limits' },
                      { title: 'Health checks (liveness/readiness probes)', known: false, key: 'probes' }
                    ]
                  },
                  {
                    week: 2,
                    title: 'CLUSTER OPERATIONS',
                    topics: [
                      { title: 'Scheduling & Node affinity', known: false, key: 'scheduling' },
                      { title: 'Rolling deployments & rollback', known: false, key: 'rolling' },
                      { title: 'Persistent Volumes & StatefulSets', known: false, key: 'volumes' }
                    ]
                  },
                  {
                    week: 3,
                    title: 'INTERVIEW PREP',
                    topics: [
                      { title: 'Common interview scenarios', known: false, key: 'scenarios' },
                      { title: 'Debugging exercises', known: false, key: 'debugging' },
                      { title: 'Mock questions & answers', known: false, key: 'mock' }
                    ]
                  }
                ]
              }
            };
          }
          if (method === 'evaluate_checkpoint') {
            return {
              success: true,
              data: {
                evaluation: 'correct',
                explanation: 'Excellent definition. You correctly identified the pod Scheduling behavior.',
                what_to_review: 'Ready to proceed to next week!'
              }
            };
          }
        }

        if (tool_id.includes('agent-supervisor')) {
          if (method === 'analyze_workflow') {
            return {
              success: true,
              data: {
                steps: [
                  {
                    id: 's1',
                    description: 'Verify environment variables and platform compatibility flags.',
                    risk_level: 'low',
                    is_irreversible: false,
                    action_type: 'safe'
                  },
                  {
                    id: 's2',
                    description: 'Run checkup tests to validate basic plugin hooks.',
                    risk_level: 'low',
                    is_irreversible: false,
                    action_type: 'safe'
                  },
                  {
                    id: 's3',
                    description: 'Write new database schema migrations and apply them to the DB.',
                    risk_level: 'high',
                    is_irreversible: true,
                    action_type: 'db_write'
                  },
                  {
                    id: 's4',
                    description: 'Clean up temporary build artifacts and build static bundles.',
                    risk_level: 'medium',
                    is_irreversible: false,
                    action_type: 'safe'
                  }
                ]
              }
            };
          }

          if (method === 'assess_step') {
            const stepId = args.step_id as string;
            if (stepId === 's3') {
              return {
                success: true,
                data: {
                  success: true,
                  step_output: 'Preparing database migration: ALTER TABLE users ADD COLUMN profile_dna jsonb...',
                  coherence_score: 85,
                  drift_warning: 'Database schema modification requested.',
                  requires_approval: true,
                  approval_reason: 'Irreversible database write operation requested.'
                }
              };
            }
            return {
              success: true,
              data: {
                success: true,
                step_output: `Step ${stepId} executed successfully. Logs written.`,
                coherence_score: 95,
                drift_warning: null,
                requires_approval: false,
                approval_reason: null
              }
            };
          }

          if (method === 'generate_summary') {
            return {
              success: true,
              data: {
                plain_english_summary: 'The workflow execution completed successfully. Basic plugins were verified, and the database schema migration was executed after receiving explicit user authorization. The agent resolved one minor schema drift warning in step 3.',
                improvement_score: 92
              }
            };
          }
        }
        if (tool_id.includes('project-genesis')) {
          if (method === 'assess_brief_depth') {
            return {
              success: true,
              data: {
                vagueness_score: 75,
                missing_dimensions: ["users", "platform", "stack", "scope", "done_when"],
                question_count_needed: 5,
                what_is_clear: ["core idea"],
              }
            };
          }
          if (method === 'generate_questions') {
            return {
              success: true,
              data: {
                questions: [
                  {
                    id: "q1",
                    question: "Who are the primary users of this application?",
                    dimension: "users",
                    why_asking: "Helps tailor the UI design and default dashboards."
                  },
                  {
                    id: "q2",
                    question: "Is this going to be a web application, mobile application, or CLI?",
                    dimension: "platform",
                    why_asking: "Determines initial tech stack choices and deployment strategy."
                  },
                  {
                    id: "q3",
                    question: "What specific front-end/back-end tech stack do you prefer (e.g. Next.js, React, Node)?",
                    dimension: "stack",
                    why_asking: "Ensures the generated architecture aligns with your team's skillset."
                  },
                  {
                    id: "q4",
                    question: "Are there any specific third-party APIs or authentication flows required in v1?",
                    dimension: "scope",
                    why_asking: "Prevents MVP scope creep and defines API design boundaries."
                  },
                  {
                    id: "q5",
                    question: "What defines success for this MVP (e.g. 'can run locally and save to localStorage')?",
                    dimension: "done_when",
                    why_asking: "Establishes a concrete definition of done for the implementation plan."
                  }
                ]
              }
            };
          }
          if (method === 'validate_spec') {
            const brief = args.brief as string || '';
            const answers = (args.answers as Record<string, string>) || {};
            return {
              success: true,
              data: {
                product_name: brief.split(' ').slice(0, 3).join(' ') || "My Project",
                one_liner: brief,
                users: answers["q1"] || "General developers",
                platform: answers["q2"] || "Web app",
                core_action: "Perform the core operations described in the brief.",
                tech_stack: ["Vite", "React", "TypeScript", "Vanilla CSS"],
                has_backend: true,
                has_database: true,
                has_ai: false,
                ai_details: "",
                out_of_scope: ["Mobile support", "Multiplayer synchronization"],
                done_when: answers["q5"] || "The basic flows run locally with no errors.",
                deployment: "Vercel",
                solo_or_team: "solo"
              }
            };
          }
          if (method === 'generate_documents') {
            const spec = (args.spec as any) || {};
            const name = spec.product_name || "My Project";
            return {
              success: true,
              data: {
                product_name: name,
                generated_at: new Date().toISOString(),
                documents: {
                  "PRD": `# ${name} — Product Requirements Document\n\n## 1. Product Vision\n${name} provides an elegant solution for developers to manage their workspace.\n\n## 2. The Problem\nDevelopers lack a centralized framework to design their build spec.\n\n## 3. Users\nDevelopers and product managers.\n\n## 4. Core Features\n- Configurable task panels\n- Project state export\n- Real-time logging simulation\n\n## 5. Out of Scope\n- Database configuration wizard\n\n## 6. Success Metrics\n- Less than 5 seconds to generate full docs\n\n## 7. Constraints\n- Single page application.\n`,
                  "TECH_SPEC": `# ${name} — Technical Specification\n\n## 1. Architecture Overview\n\`\`\`\n[UI Shell (React)] ---> [State Store (Zustand)]\n                        [Plugin Interface (Python)]\n\`\`\`\n\n## 2. Tech Stack\n- Vite + React + TS\n- CSS Modules\n\n## 3. Directory Structure\n\`\`\`\nsrc/\n  components/\n    Workspace.tsx\n  hooks/\n    useWorkspace.ts\n\`\`\`\n\n## 4. Key Components\n- Workspace: handles document markdown editing and sync.\n`,
                  "APP_FLOW": `# ${name} — App Flow\n\n## 1. Entry & Initialization\nUser accesses route and lands on the document workspace.\n\n## 2. Navigation Structure\n- Sidebar Tabs -> Document selection\n- Bottom bar -> Download zip / reload\n`,
                  "DESIGN": `# ${name} — Design Document\n\n## 1. Design Philosophy\nSleek, dark, and futuristic interface.\n\n## 2. Color System\n\`\`\`css\n--primary: #D946EF;\n--background: #09090B;\n\`\`\`\n`,
                  "SCHEMA": `# ${name} — Data Schema\n\n## 1. Storage Strategy\nZustand persisted in localStorage.\n\n## 2. TypeScript Types\n\`\`\`typescript\ninterface Project {\n  id: string;\n  name: string;\n}\n\`\`\`\n`,
                  "IMPLEMENTATION_PLAN": `# ${name} — Implementation Plan\n\n## Phase 0 — Scaffold\nRun npm init.\n\n## Phase 1 — Core Layout\nSet up workspace modules.\n`,
                  "TRACKER": `# ${name} — Build Tracker\n\n## Progress\n- [ ] Phase 0: Setup\n- [ ] Phase 1: Core Layout\n`,
                  "RULES": `# ${name} — Agent Rules\n\n## 1. Strict Typing\nEnsure no any types are introduced.\n`
                }
              }
            };
          }
        }

        return {
          success: false,
          error: `Mock method ${method} not implemented for ${tool_id}`
        };
      },
    },
  };
}
