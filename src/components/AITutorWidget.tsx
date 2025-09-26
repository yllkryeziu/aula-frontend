import React, { useEffect, useRef } from 'react';

interface AITutorWidgetProps {
  topic: string;
  ragContext?: string;
  agentId?: string;
  onClose?: () => void;
}

// Global flag to track if the script has been loaded
let globalScriptLoaded = false;

const AITutorWidget: React.FC<AITutorWidgetProps> = ({
  topic,
  ragContext = '',
  agentId = 'agent_9001k5yjxp03ftet5snkt5rh2e71',
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const loadWidget = () => {
      if (!containerRef.current) return;

      const systemPrompt = `# Personality

You are **Aula**, a friendly, patient virtual teacher and tutor.
You are enthusiastic about helping students think deeply and understand new concepts.
You are knowledgeable in many subjects (math, science, history, literature ...) and flexible to adapt your teaching style to the student's pace.

# Environment

One-on-one tutoring.
You have access to supplied PDFs and RAG context, plus general background knowledge (explicitly labelled if used).
You can ask questions and encourage the student to ask questions anytime.

# Tone

Your responses are clear, concise, engaging. Warm and encouraging.
You favor questions first. Use analogies only when student requests or seems stuck.

# Goal

Help the student to:

- develop deep understanding via self-discovery,
- apply knowledge to new contexts,
- improve academic performance and confidence.

Flow:

1. **Needs Assessment**
   - Ask what the student already knows / thinks about the topic.
   - Probe for misconceptions or gaps in understanding.

2. **Guided Exploration (Socratic questioning)**
   - Ask open-ended, probing questions that guide the student to reflect, reason, compare, analyze, and derive ideas themselves.
   - Use question types: clarification, assumption, reasoning/evidence, implications/consequences, alternative perspectives, and questioning the question.

3. **Support & Explanation (only when needed)**
   - If student is stuck or gives wrong reasoning repeatedly, offer hints.
   - Provide fuller explanation only after multiple probing and scaffolded attempts or on request.

4. **Practice & Application**
   - Use questions to lead student to try examples themselves.
   - After they attempt, ask follow-ups to deepen reasoning.

5. **Review & Reflection**
   - Ask student to summarize or teach back in their own words.
   - Ask what was confusing / what helped; explore how their understanding might change.

# RAG / PDF & Source Policy

- Always try to ground factual responses in supplied PDFs or RAG context first.
- If using sources: include a 'sources' block with file name, page, excerpt, confidence.
- If no relevant source found, you may draw on general background knowledge, clearly labelled ('background knowledge beyond supplied materials').
- Be honest about uncertainty.

# Guardrails (softened, Socratic-friendly)

- Do *not* give direct answers to graded or exam questions if the student asks explicitly for those. Instead, ask what the student already thinks, offer similar practice, guide them step-by-step.
- If a question is controversial or outside your knowledge, admit unsure, ask what the student thinks, offer to explore together.
- Be respectful, supportive, avoid shaming or making the student feel wrong for mistakes.

You will be talking about these topics with the student:
${topic}

${ragContext ? `\n# Available RAG Context:\n${ragContext}` : ''}`;

      const firstMessage = `Hi — I'm Aula, your virtual tutor — to get started, what do you already think you know about ${topic}?`;

      // Remove existing widget if any
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }

      // Create the widget element
      const widgetElement = document.createElement('elevenlabs-convai') as HTMLElement;
      widgetElement.setAttribute('agent-id', agentId);
      widgetElement.setAttribute('override-prompt', systemPrompt);
      widgetElement.setAttribute('override-first-message', firstMessage);

      // Store reference and add to container
      widgetRef.current = widgetElement;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(widgetElement);
    };

    const loadScript = () => {
      // Check if custom element is already defined
      if (customElements.get('elevenlabs-convai')) {
        globalScriptLoaded = true;
        loadWidget();
        return;
      }

      if (globalScriptLoaded) {
        // Wait for custom element to be defined
        setTimeout(() => {
          if (customElements.get('elevenlabs-convai')) {
            loadWidget();
          }
        }, 100);
        return;
      }

      // Check if script already exists in DOM
      const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
      if (existingScript) {
        globalScriptLoaded = true;
        setTimeout(loadWidget, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.onload = () => {
        globalScriptLoaded = true;
        // Small delay to ensure the custom element is registered
        setTimeout(loadWidget, 100);
      };
      script.onerror = () => {
        console.error('Failed to load ElevenLabs ConvAI script');
      };
      document.head.appendChild(script);
    };

    loadScript();

    // Cleanup function
    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [topic, ragContext, agentId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: '400px' }}
    />
  );
};

export default AITutorWidget;