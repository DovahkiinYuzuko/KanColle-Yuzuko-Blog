import { ParsedData, CliOptions } from './types.js';

export function buildMarkdownOutput(parsedData: ParsedData, options: CliOptions): string {
  const lines: string[] = [];

  let baseTitle = options.title;
  let fleetTitle = options.fleetTitle;
  let airTitle = options.airTitle;

  if (!baseTitle && !fleetTitle && !airTitle) {
    if (parsedData.fleets.length > 0 && parsedData.airBases.length > 0) {
      baseTitle = '艦隊/基地航空隊';
    } else if (parsedData.fleets.length > 0) {
      baseTitle = '艦隊';
    } else if (parsedData.airBases.length > 0) {
      baseTitle = '基地航空隊';
    } else {
      baseTitle = '艦隊/基地航空隊';
    }
  }

  const finalFleetTitle = fleetTitle || baseTitle || '艦隊';
  const finalAirTitle = airTitle || (baseTitle ? (baseTitle.includes('基地') ? baseTitle : `${baseTitle}基地航空隊`) : '基地航空隊');

  if (parsedData.fleets.length > 0) {
    for (const fleet of parsedData.fleets) {
      lines.push(`- **第${fleet.number}艦隊:**`);
      lines.push('```yaml');
      lines.push(`${finalFleetTitle}:`);

      for (const ship of fleet.ships) {
        lines.push(`  - name: ${ship.name}`);
        lines.push(`    level: ${ship.level}`);
        lines.push('    equipments:');
        for (const eq of ship.equipments) {
          lines.push(`      - ${eq}`);
        }
        lines.push('');
      }

      if (lines[lines.length - 1] === '') {
        lines.pop();
      }
      lines.push('```');
      lines.push('');
    }
  }

  if (parsedData.airBases.length > 0) {
    lines.push('- **基地航空隊:**');
    lines.push('```yaml');
    lines.push(`${finalAirTitle}:`);

    for (const air of parsedData.airBases) {
      lines.push(`  - number: ${air.number}`);
      lines.push(`    mode: ${air.mode}`);
      lines.push('    squadrons:');
      for (const sq of air.squadrons) {
        lines.push(`      - ${sq}`);
      }
      lines.push('');
    }

    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
