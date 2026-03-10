<script lang="ts">
  let hydrated = $state(false);
  $effect(() => { hydrated = true; });

  let revealFormat = $state(false);
</script>

<section>
  <div class="prose">
    <h2 id="prologue">Prologue: How the Machine Sees Your Code</h2>

    <p>
      Before we write any subprograms, let's ground ourselves in the mental model
      that makes MIPS make sense. This page won't ask you to memorize anything —
      it sets up the vocabulary so the acts that follow can move quickly.
    </p>

    <!-- ── 2a. Registers Are Named Boxes ── -->
    <h3>Registers Are Named Boxes</h3>

    <p>
      The CPU has 32 general-purpose registers — tiny, blazing-fast storage slots
      right on the chip. You don't need all 32 today. Here are the ~10 we'll
      actually use:
    </p>

    <div class="register-grid">
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$a0</span>
        <span class="reg-tooltip">Argument 0 — first input to a subprogram</span>
      </div>
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$a1</span>
        <span class="reg-tooltip">Argument 1 — second input to a subprogram</span>
      </div>
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$a2</span>
        <span class="reg-tooltip">Argument 2 — third input to a subprogram</span>
      </div>
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$a3</span>
        <span class="reg-tooltip">Argument 3 — fourth input to a subprogram</span>
      </div>
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$v0</span>
        <span class="reg-tooltip">Return value 0 — primary output of a subprogram</span>
      </div>
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$v1</span>
        <span class="reg-tooltip">Return value 1 — secondary output (rarely used)</span>
      </div>
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$ra</span>
        <span class="reg-tooltip">Return address — where to jump back after a subprogram</span>
      </div>
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$zero</span>
        <span class="reg-tooltip">Hardwired to 0 — writes are ignored, always reads as zero</span>
      </div>
      <div class="reg-card" tabindex="0">
        <span class="reg-name">$t0</span>
        <span class="reg-tooltip">Temporary — scratch space, not preserved across calls</span>
      </div>
      <div class="reg-card reg-card--special" tabindex="0">
        <span class="reg-name">$pc</span>
        <span class="reg-tooltip">Program counter — address of the current instruction (not directly writable)</span>
      </div>
    </div>

    <p class="muted">...and 22 more. You'll meet them when you need them.</p>

    <!-- ── 2b. Addresses Are Just Numbers ── -->
    <h3>Addresses Are Just Numbers</h3>

    <p>
      Your program lives in memory. Each instruction has a fixed address, like a
      house number on a street:
    </p>

    <div class="address-table-wrapper">
      <table class="address-table">
        <thead>
          <tr>
            <th>Address</th>
            <th>Instruction</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>0x00400000</code></td>
            <td><code>li &nbsp;$a0, 10</code></td>
          </tr>
          <tr>
            <td><code>0x00400004</code></td>
            <td><code>li &nbsp;$a1, 20</code></td>
          </tr>
          <tr>
            <td><code>0x00400008</code></td>
            <td><code>jal NOR</code></td>
          </tr>
          <tr>
            <td><code>0x0040000C</code></td>
            <td><code>move $t0, $v0</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="callout">
      <strong>Why count by 4?</strong> Every instruction lives at an address. The CPU
      reads the address in <code>$pc</code>, executes that instruction, then adds 4 to
      <code>$pc</code>. Addresses count up by 4 because each instruction is exactly 4 bytes
      (32 bits).
    </div>

    <div class="callout">
      <strong>Hex addresses:</strong> <code>0x00400008</code> means the third instruction —
      addresses start at <code>0x00400000</code> and count up by 4.
      The <code>0x</code> prefix just means "this number is in hexadecimal."
    </div>

    <!-- ── 2c. Real vs. Pseudo-Instructions ── -->
    <h3>Real vs. Pseudo-Instructions</h3>

    <div class="callout">
      <strong>Good to know:</strong> MIPS has ~60 real hardware instructions. The assembler
      also provides convenience shortcuts called <em>pseudo-instructions</em> that expand
      into one or more real instructions. Example: <code>move $t0, $t1</code> expands to
      <code>addu $t0, $zero, $t1</code>. We'll note which are which as we go — it's a
      "fun fact," not something you need to memorize.
    </div>

    <!-- ── 2d. Instruction Format ── -->
    <h3>Instruction Format: rd, rs, rt</h3>

    <p>
      Most arithmetic/logic MIPS instructions follow a three-register pattern:
    </p>

    <div class="format-visual">
      <div class="format-parts">
        <span class="format-op">op</span>
        <span class="format-rd">rd<span class="format-label">destination</span></span>
        <span class="format-comma">,</span>
        <span class="format-rs">rs<span class="format-label">source</span></span>
        <span class="format-comma">,</span>
        <span class="format-rt">rt<span class="format-label">target</span></span>
      </div>
      <ul class="format-legend">
        <li><strong>rd</strong> = register destination — where the result goes</li>
        <li><strong>rs</strong> = register source — first input</li>
        <li><strong>rt</strong> = register target — second input</li>
      </ul>
    </div>

    <div class="question">
      <p>In <code>nor $v0, $a0, $a1</code>, which register is rd, rs, and rt?</p>
    </div>

    <div class="reveal" data-open={revealFormat}>
      <div class="reveal-inner">
        <div class="insight">
          <strong>rd</strong> = <code>$v0</code> (destination — result goes here),
          <strong>rs</strong> = <code>$a0</code> (source — first input),
          <strong>rt</strong> = <code>$a1</code> (target — second input).
          The destination always comes first in MIPS assembly.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealFormat = true} disabled={!hydrated}>Reveal answer</button>
    </p>

    <p>
      With these concepts in place, you're ready for the main acts.
    </p>
  </div>
</section>

<style>
  /* ── Register grid ── */
  .register-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    gap: 0.5rem;
    margin: 1rem 0 0.25rem;
  }

  .reg-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 0.5rem;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: default;
    transition: border-color 0.15s;
  }

  .reg-card:hover,
  .reg-card:focus-visible {
    border-color: var(--color-accent, #4d9fff);
    outline: none;
  }

  .reg-card--special {
    border-style: dashed;
  }

  .reg-name {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-accent, #4d9fff);
  }

  .reg-tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    max-width: 14rem;
    padding: 0.35rem 0.55rem;
    font-family: var(--font-body, Inter, sans-serif);
    font-size: 0.78rem;
    line-height: 1.35;
    color: var(--color-text, #e0e0e0);
    background: var(--color-bg-surface, #1e1e2e);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 10;
  }

  .reg-card:hover .reg-tooltip,
  .reg-card:focus-visible .reg-tooltip {
    opacity: 1;
  }

  .muted {
    color: var(--color-text-muted, #999);
    font-style: italic;
    margin-top: 0.25rem;
  }

  /* ── Address table ── */
  .address-table-wrapper {
    overflow-x: auto;
    margin: 1rem 0;
  }

  .address-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.9rem;
  }

  .address-table th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--color-border, #333);
    color: var(--color-text-muted, #999);
    font-family: var(--font-body, Inter, sans-serif);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .address-table td {
    padding: 0.45rem 0.75rem;
    border-bottom: 1px solid var(--color-border, #333);
    color: var(--color-text, #e0e0e0);
  }

  .address-table tr:last-child td {
    border-bottom: none;
  }

  /* ── Instruction format visual ── */
  .format-visual {
    margin: 1rem 0;
    padding: 1rem 1.25rem;
    background: var(--color-bg-surface, #1e1e2e);
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
  }

  .format-parts {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .format-op {
    color: var(--color-text-muted, #999);
    margin-right: 0.5rem;
  }

  .format-rd,
  .format-rs,
  .format-rt {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
  }

  .format-rd { color: var(--color-highlight, #f5a623); }
  .format-rs { color: var(--color-accent, #4d9fff); }
  .format-rt { color: #66d9ef; }

  .format-comma {
    color: var(--color-text-muted, #999);
  }

  .format-label {
    display: block;
    font-size: 0.65rem;
    font-weight: 400;
    font-family: var(--font-body, Inter, sans-serif);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.15rem;
    opacity: 0.8;
  }

  .format-legend {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--color-text, #e0e0e0);
  }

  .format-legend li {
    padding: 0;
  }

  .format-legend strong {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
</style>
