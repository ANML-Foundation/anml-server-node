/**
 * ANML 1.0 Document Validation
 *
 * Validates AnmlDocument instances against the ANML 1.0 specification rules.
 */

import type { AnmlDocument } from "./types.js";

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate an ANML document against the specification.
 * Returns a ValidationResult with validity flag and array of errors/warnings.
 */
export function validate(doc: AnmlDocument): ValidationResult {
  const errors: ValidationError[] = [];

  // Version is required
  if (!doc.version) {
    errors.push({ path: "version", message: "Document version is required", severity: "error" });
  } else if (doc.version !== "1.0") {
    errors.push({ path: "version", message: `Unsupported version "${doc.version}". Only "1.0" is supported.`, severity: "warning" });
  }

  // Head validation
  if (doc.head?.meta) {
    for (let i = 0; i < doc.head.meta.length; i++) {
      const meta = doc.head.meta[i]!;
      if (!meta.name) {
        errors.push({ path: `head.meta[${i}].name`, message: "Meta entry must have a name", severity: "error" });
      }
      if (!meta.value) {
        errors.push({ path: `head.meta[${i}].value`, message: "Meta entry must have a value", severity: "error" });
      }
    }
  }

  // Constraints validation
  if (doc.constraints?.disclosure) {
    const validRequires = ["explicit-consent", "implicit-consent", "authentication", "none"];
    for (let i = 0; i < doc.constraints.disclosure.length; i++) {
      const d = doc.constraints.disclosure[i]!;
      if (!d.field) {
        errors.push({ path: `constraints.disclosure[${i}].field`, message: "Disclosure must reference a field", severity: "error" });
      }
      if (!d.requires) {
        errors.push({ path: `constraints.disclosure[${i}].requires`, message: "Disclosure must specify a requires value", severity: "error" });
      } else if (!validRequires.includes(d.requires)) {
        errors.push({ path: `constraints.disclosure[${i}].requires`, message: `Invalid requires value "${d.requires}". Must be one of: ${validRequires.join(", ")}`, severity: "error" });
      }
    }
  }

  // State validation
  if (doc.state) {
    const flowStepIds = new Set<string>();
    if (doc.state.flow?.step) {
      for (let i = 0; i < doc.state.flow.step.length; i++) {
        const step = doc.state.flow.step[i]!;
        if (!step.id) {
          errors.push({ path: `state.flow.step[${i}].id`, message: "Step must have an id", severity: "error" });
        } else {
          if (flowStepIds.has(step.id)) {
            errors.push({ path: `state.flow.step[${i}].id`, message: `Duplicate step id "${step.id}"`, severity: "error" });
          }
          flowStepIds.add(step.id);
        }
        if (step.status) {
          const validStatuses = ["completed", "current", "pending", "skipped"];
          if (!validStatuses.includes(step.status)) {
            errors.push({ path: `state.flow.step[${i}].status`, message: `Invalid step status "${step.status}"`, severity: "error" });
          }
        }
      }
    }
    if (doc.state.context?.step && flowStepIds.size > 0) {
      if (!flowStepIds.has(doc.state.context.step)) {
        errors.push({ path: "state.context.step", message: `Context step "${doc.state.context.step}" does not match any flow step id`, severity: "error" });
      }
    }
  }

  // Interact validation
  if (doc.interact?.action) {
    const actionIds = new Set<string>();
    for (let i = 0; i < doc.interact.action.length; i++) {
      const action = doc.interact.action[i]!;
      if (!action.id) {
        errors.push({ path: `interact.action[${i}].id`, message: "Action must have an id", severity: "error" });
      } else {
        if (actionIds.has(action.id)) {
          errors.push({ path: `interact.action[${i}].id`, message: `Duplicate action id "${action.id}"`, severity: "error" });
        }
        actionIds.add(action.id);
      }
      if (!action.endpoint) {
        errors.push({ path: `interact.action[${i}].endpoint`, message: "Action must have an endpoint", severity: "error" });
      }
      if (action.method) {
        const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
        if (!validMethods.includes(action.method)) {
          errors.push({ path: `interact.action[${i}].method`, message: `Invalid HTTP method "${action.method}"`, severity: "error" });
        }
      }
      if (action.params) {
        const paramNames = new Set<string>();
        for (let j = 0; j < action.params.length; j++) {
          const param = action.params[j]!;
          if (!param.name) {
            errors.push({ path: `interact.action[${i}].params[${j}].name`, message: "Param must have a name", severity: "error" });
          } else {
            if (paramNames.has(param.name)) {
              errors.push({ path: `interact.action[${i}].params[${j}].name`, message: `Duplicate param name "${param.name}" in action "${action.id}"`, severity: "warning" });
            }
            paramNames.add(param.name);
          }
        }
      }
    }

    // Validate ask action references
    if (doc.knowledge?.ask) {
      for (let i = 0; i < doc.knowledge.ask.length; i++) {
        const ask = doc.knowledge.ask[i]!;
        if (ask.action && actionIds.size > 0 && !actionIds.has(ask.action)) {
          errors.push({ path: `knowledge.ask[${i}].action`, message: `Ask references action "${ask.action}" which is not defined in interact section`, severity: "error" });
        }
      }
    }
  }

  // Knowledge validation
  if (doc.knowledge) {
    if (doc.knowledge.ask) {
      for (let i = 0; i < doc.knowledge.ask.length; i++) {
        const ask = doc.knowledge.ask[i]!;
        if (!ask.field) {
          errors.push({ path: `knowledge.ask[${i}].field`, message: "Ask must have a field", severity: "error" });
        }
        if (!ask.action) {
          errors.push({ path: `knowledge.ask[${i}].action`, message: "Ask must reference an action", severity: "error" });
        }
      }
    }
    if (doc.knowledge.inform) {
      for (let i = 0; i < doc.knowledge.inform.length; i++) {
        const inform = doc.knowledge.inform[i]!;
        if (!inform.content) {
          errors.push({ path: `knowledge.inform[${i}].content`, message: "Inform must have content", severity: "error" });
        }
      }
    }
  }

  // TTL validation
  if (doc.ttl !== undefined) {
    if (doc.ttl < 0) {
      errors.push({ path: "ttl", message: "TTL must be a non-negative integer", severity: "error" });
    }
    if (!Number.isInteger(doc.ttl)) {
      errors.push({ path: "ttl", message: "TTL must be an integer", severity: "warning" });
    }
  }

  // Footer/rights validation
  if (doc.footer?.rights?.usage) {
    const validUsage = ["none", "display", "cache", "store", "train"];
    if (!validUsage.includes(doc.footer.rights.usage)) {
      errors.push({ path: "footer.rights.usage", message: `Invalid usage value "${doc.footer.rights.usage}"`, severity: "error" });
    }
  }

  return {
    valid: errors.filter((e) => e.severity === "error").length === 0,
    errors,
  };
}
