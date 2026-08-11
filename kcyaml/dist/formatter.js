function getFinalTitles(parsedData, options) {
    let baseTitle = options.title;
    let fleetTitle = options.fleetTitle;
    let airTitle = options.airTitle;
    if (!baseTitle && !fleetTitle && !airTitle) {
        if (parsedData.fleets.length > 0 && parsedData.airBases.length > 0) {
            baseTitle = '艦隊/基地航空隊';
        }
        else if (parsedData.fleets.length > 0) {
            baseTitle = '艦隊';
        }
        else if (parsedData.airBases.length > 0) {
            baseTitle = '基地航空隊';
        }
        else {
            baseTitle = '艦隊/基地航空隊';
        }
    }
    const finalFleetTitle = fleetTitle || baseTitle || '艦隊';
    const finalAirTitle = airTitle || (baseTitle ? (baseTitle.includes('基地') ? baseTitle : `${baseTitle}基地航空隊`) : '基地航空隊');
    return { finalFleetTitle, finalAirTitle };
}
export function buildMarkdownOutput(parsedData, options) {
    const lines = [];
    const { finalFleetTitle, finalAirTitle } = getFinalTitles(parsedData, options);
    if (parsedData.fleets.length > 0) {
        const isCombined = Boolean(options.rengo || (parsedData.combinedFighterPower !== undefined && parsedData.fleets.length > 1));
        if (isCombined) {
            lines.push('連合艦隊');
            lines.push('');
        }
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
            if (!isCombined) {
                if (fleet.fighterPower !== undefined) {
                    lines.push(`- **制空値:** ${fleet.fighterPower}`);
                }
                if (fleet.saku33 !== undefined) {
                    lines.push('- **33式分岐点係数:**');
                    lines.push('');
                    lines.push('|番号|係数|');
                    lines.push('|:---:|---|');
                    lines.push(`|1|${fleet.saku33.c1.toFixed(2)}|`);
                    lines.push(`|2|${fleet.saku33.c2.toFixed(2)}|`);
                    lines.push(`|3|${fleet.saku33.c3.toFixed(2)}|`);
                    lines.push(`|4|${fleet.saku33.c4.toFixed(2)}|`);
                }
                lines.push('');
            }
        }
        if (isCombined) {
            if (parsedData.combinedFighterPower !== undefined) {
                lines.push(`- **制空値:** ${parsedData.combinedFighterPower}`);
            }
            if (parsedData.combinedSaku33 !== undefined) {
                lines.push('- **33式分岐点係数:**');
                lines.push('');
                lines.push('|番号|係数|');
                lines.push('|:---:|---|');
                lines.push(`|1|${parsedData.combinedSaku33.c1.toFixed(2)}|`);
                lines.push(`|2|${parsedData.combinedSaku33.c2.toFixed(2)}|`);
                lines.push(`|3|${parsedData.combinedSaku33.c3.toFixed(2)}|`);
                lines.push(`|4|${parsedData.combinedSaku33.c4.toFixed(2)}|`);
            }
            lines.push('');
        }
    }
    if (parsedData.airBases.length > 0) {
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
export function buildYamlOutput(parsedData, options) {
    const lines = [];
    const { finalFleetTitle, finalAirTitle } = getFinalTitles(parsedData, options);
    if (parsedData.fleets.length > 0) {
        for (const fleet of parsedData.fleets) {
            lines.push(`${finalFleetTitle}_F${fleet.number}:`);
            for (const ship of fleet.ships) {
                lines.push(`  - name: ${ship.name}`);
                lines.push(`    level: ${ship.level}`);
                lines.push('    equipments:');
                for (const eq of ship.equipments) {
                    lines.push(`      - ${eq}`);
                }
                lines.push('');
            }
        }
    }
    if (parsedData.airBases.length > 0) {
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
    }
    return lines.join('\n').trimEnd();
}
