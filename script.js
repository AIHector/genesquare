document.addEventListener('DOMContentLoaded', () => {
    const traitsContainer = document.getElementById('traits-container');
    const addTraitButton = document.getElementById('addTraitButton');
    const calculateButton = document.getElementById('calculateButton');
    const errorMessagesDiv = document.getElementById('errorMessages');
    const showSexDetailsCheckbox = document.getElementById('showSexDetails');
    const parent1GenotypeInputsDiv = document.getElementById('parent1GenotypeInputs');
    const parent2GenotypeInputsDiv = document.getElementById('parent2GenotypeInputs');
    const parent1SexDisplay = document.getElementById('parent1SexDisplay');
    const parent2SexDisplay = document.getElementById('parent2SexDisplay');
    const p1GameteLabel = document.getElementById('p1GameteLabel');
    const p2GameteLabel = document.getElementById('p2GameteLabel');
    const p1GametesSpan = document.getElementById('p1Gametes');
    const p2GametesSpan = document.getElementById('p2Gametes');
    const punnettSquareOrTableDiv = document.getElementById('punnettSquareOrTable');
    const genoListUl = document.getElementById('genoList');
    const phenoListUl = document.getElementById('phenoList');
    const sexRatioDiv = document.getElementById('sexRatio'); 
    const sexRatioTextP = document.getElementById('sexRatioText');
    const genoSortSelect = document.getElementById('genoSort'); 
    const phenoSortSelect = document.getElementById('phenoSort'); 

    let traitCount = 0;
    const MAX_TRAITS = 3;

    let currentGenotypicRatios = {}; let currentPhenotypicRatios = {};
    let currentAggregateGenotypicRatios = {}; let currentAggregatePhenotypicRatios = {};
    let currentShowSexDetailsState = true; 

    addTrait(); 
    updateSexSpecificUI(showSexDetailsCheckbox.checked); 

    showSexDetailsCheckbox.addEventListener('change', () => {
        updateSexSpecificUI(showSexDetailsCheckbox.checked);
        updateParentalGenotypeInputs();
    });

    addTraitButton.addEventListener('click', () => {
        if (traitCount < MAX_TRAITS) { addTrait(); }
        if (traitCount >= MAX_TRAITS) { addTraitButton.disabled = true; addTraitButton.textContent = "Max Traits Reached"; }
    });
    
    genoSortSelect.addEventListener('change', () => {
        displayGenotypicRatios(currentGenotypicRatios, currentAggregateGenotypicRatios, currentShowSexDetailsState, genoSortSelect.value);
    });
    phenoSortSelect.addEventListener('change', () => {
        displayPhenotypicRatios(currentPhenotypicRatios, currentAggregatePhenotypicRatios, currentShowSexDetailsState, phenoSortSelect.value);
    });

    calculateButton.addEventListener('click', () => {
        clearPreviousResults();
        try {
            const settings = getAndValidateAllInputs();
            if (!settings) return; 

            const { traits, parent1AllGenotypes, parent2AllGenotypes } = settings;
            currentShowSexDetailsState = showSexDetailsCheckbox.checked; 

            const parent1Gametes = generateMultiTraitGametes(parent1AllGenotypes, traits, 'XX');
            const parent2Gametes = generateMultiTraitGametes(parent2AllGenotypes, traits, 'XY');
            displayGametes(parent1Gametes, parent2Gametes, traits, currentShowSexDetailsState);

            const offspring = crossMultiTrait(parent1Gametes, parent2Gametes, traits);
            const analysisResults = analyzeMultiTraitOffspring(offspring, traits);
            currentGenotypicRatios = analysisResults.genotypicRatios;
            currentPhenotypicRatios = analysisResults.phenotypicRatios;
            currentAggregateGenotypicRatios = analysisResults.aggregateGenotypicRatios;
            currentAggregatePhenotypicRatios = analysisResults.aggregatePhenotypicRatios;

            if (traits.length === 1) { displayPunnettSquare(parent1Gametes, parent2Gametes, traits[0], currentShowSexDetailsState);  }
            else { displayProbabilityTable(offspring, traits, currentShowSexDetailsState);  }
            
            displayGenotypicRatios(currentGenotypicRatios, currentAggregateGenotypicRatios, currentShowSexDetailsState, genoSortSelect.value);
            displayPhenotypicRatios(currentPhenotypicRatios, currentAggregatePhenotypicRatios, currentShowSexDetailsState, phenoSortSelect.value);
            
            sexRatioDiv.classList.toggle('hidden-by-toggle', !currentShowSexDetailsState); 
            if(currentShowSexDetailsState) displaySexRatio(analysisResults.overallSexRatio);

        } catch (error) { errorMessagesDiv.textContent = `An unexpected error occurred: ${error.message} (Check console for details)`; console.error(error); }
    });

    function updateSexSpecificUI(showDetails) {
        sexRatioDiv.classList.toggle('hidden-by-toggle', !showDetails);
        const p1Help = document.getElementById('parent1GenoHelp'); const p2Help = document.getElementById('parent2GenoHelp');
        if (showDetails) {
            parent1SexDisplay.innerHTML = `(Female: XX <span class="female-symbol">♀</span>)`; parent2SexDisplay.innerHTML = `(Male: XY <span class="male-symbol">♂</span>)`;
            p1GameteLabel.innerHTML = `Parent 1 (<span class="female-symbol">♀</span> XX) Gametes:`; p2GameteLabel.innerHTML = `Parent 2 (<span class="male-symbol">♂</span> XY) Gametes:`;
            if(p1Help) p1Help.textContent = "Select alleles or use preset buttons. Y-linked: N/A for XX."; if(p2Help) p2Help.textContent = "Select alleles or use preset buttons. Y-linked: Select Y-allele.";
        } else {
            parent1SexDisplay.textContent = ""; parent2SexDisplay.textContent = "";
            p1GameteLabel.textContent = "Parent 1 Gametes:"; p2GameteLabel.textContent = "Parent 2 Gametes:";
            if(p1Help) p1Help.textContent = "Select alleles or use preset buttons. Sex-linked traits behave as autosomal."; if(p2Help) p2Help.textContent = "Select alleles or use preset buttons. Sex-linked traits behave as autosomal.";
        }
    }

    function addTrait() {
        traitCount++; const traitId = `trait${traitCount}`; const traitBlock = document.createElement('div'); traitBlock.className = 'trait-block'; traitBlock.id = traitId;
        traitBlock.innerHTML = `<h4>Trait ${traitCount} ${traitCount > 1 ? `<button class="remove-trait-button" data-traitid="${traitId}">Remove</button>` : ''}</h4> <label for="${traitId}_name">Trait Name:</label> <input type="text" id="${traitId}_name" class="trait-name-input" data-trait-block-id="${traitId}" value=""><br> <label for="${traitId}_allele1Symbol">Allele 1 Symbol:</label> <input type="text" id="${traitId}_allele1Symbol" class="allele-symbol-input" data-trait-block-id="${traitId}" data-allele-num="1" value="" maxlength="2"><br> <label for="${traitId}_allele1Name">Allele 1 Phenotype:</label> <input type="text" id="${traitId}_allele1Name" value=""> <label class="color-input-label">Color:</label><input type="color" id="${traitId}_allele1Color" value="${getRandomColor()}"><br> <label for="${traitId}_allele2Symbol">Allele 2 Symbol:</label> <input type="text" id="${traitId}_allele2Symbol" class="allele-symbol-input" data-trait-block-id="${traitId}" data-allele-num="2" value="" maxlength="2"><br> <label for="${traitId}_allele2Name">Allele 2 Phenotype:</label> <input type="text" id="${traitId}_allele2Name" value=""> <label class="color-input-label">Color:</label><input type="color" id="${traitId}_allele2Color" value="${getRandomColor()}"><br> <label for="${traitId}_dominance">Dominance: Allele 1 is</label> <select id="${traitId}_dominance" class="trait-dominance-select" data-trait-block-id="${traitId}"><option value="dominant" selected>Dominant over Allele 2</option><option value="recessive">Recessive to Allele 2</option></select><br> <label for="${traitId}_sexLinked">Linkage Type:</label> <select id="${traitId}_sexLinked" class="linkage-type-select" data-trait-block-id="${traitId}"><option value="autosomal" selected>Autosomal</option><option value="X-linked">X-Linked</option><option value="Y-linked">Y-Linked</option></select><br>`;
        traitsContainer.appendChild(traitBlock);
        traitBlock.querySelector(`#${traitId}_name`).addEventListener('input', () => updateParentalGenotypeInputs());
        traitBlock.querySelectorAll(`.allele-symbol-input`).forEach(input => input.addEventListener('input', () => updateParentalGenotypeInputs()));
        traitBlock.querySelector(`#${traitId}_dominance`).addEventListener('change', () => updateParentalGenotypeInputs());
        traitBlock.querySelector(`#${traitId}_sexLinked`).addEventListener('change', () => updateParentalGenotypeInputs());
        if (traitCount > 1) { const removeBtn = traitBlock.querySelector('.remove-trait-button'); if (removeBtn) removeBtn.addEventListener('click', (e) => removeTrait(e.target.dataset.traitid));}
        updateParentalGenotypeInputs();
    }
    
    function removeTrait(traitIdToRemove) {
        const traitBlockToRemove = document.getElementById(traitIdToRemove);
        if (traitBlockToRemove) { traitsContainer.removeChild(traitBlockToRemove); addTraitButton.disabled = false; addTraitButton.textContent = "Add Trait (Max 3)"; renumberTraitsUI(); updateParentalGenotypeInputs(); }
    }

    function renumberTraitsUI() {
        const remainingTraitBlocks = traitsContainer.querySelectorAll('.trait-block'); traitCount = 0; 
        remainingTraitBlocks.forEach(block => {
            traitCount++; const oldIdPrefix = block.id; const newIdPrefix = `trait${traitCount}`; block.id = newIdPrefix; 
            const h4 = block.querySelector('h4'); let removeButtonHTML = ''; const existingRemoveButton = block.querySelector('.remove-trait-button');
            if (remainingTraitBlocks.length > 1) { if(existingRemoveButton) { existingRemoveButton.dataset.traitid = newIdPrefix; removeButtonHTML = existingRemoveButton.outerHTML; } else { removeButtonHTML = `<button class="remove-trait-button" data-traitid="${newIdPrefix}">Remove</button>`; } }
            else if (existingRemoveButton) { existingRemoveButton.remove(); }
            h4.innerHTML = `Trait ${traitCount} ${removeButtonHTML}`;
            block.querySelectorAll('[id]').forEach(el => { if (el.id.startsWith(oldIdPrefix + "_")) el.id = el.id.replace(oldIdPrefix, newIdPrefix); if (el.classList.contains('trait-name-input') || el.classList.contains('allele-symbol-input') || el.classList.contains('linkage-type-select') || el.classList.contains('trait-dominance-select')) el.dataset.traitBlockId = newIdPrefix; });
            block.querySelectorAll('label[for]').forEach(el => { if (el.htmlFor.startsWith(oldIdPrefix + "_")) el.htmlFor = el.htmlFor.replace(oldIdPrefix, newIdPrefix); });
            const nameInput = block.querySelector(`#${newIdPrefix}_name`); if (nameInput) { const newNameInput = nameInput.cloneNode(true); nameInput.parentNode.replaceChild(newNameInput, nameInput); newNameInput.addEventListener('input', () => updateParentalGenotypeInputs());}
            block.querySelectorAll(`.allele-symbol-input`).forEach(input => { const newAlleleInput = input.cloneNode(true); input.parentNode.replaceChild(newAlleleInput, input); newAlleleInput.addEventListener('input', () => updateParentalGenotypeInputs()); });
            const dominanceSelect = block.querySelector(`#${newIdPrefix}_dominance`); if(dominanceSelect) { const newDominanceSelect = dominanceSelect.cloneNode(true); dominanceSelect.parentNode.replaceChild(newDominanceSelect, dominanceSelect); newDominanceSelect.addEventListener('change', () => updateParentalGenotypeInputs());}
            const linkageSelect = block.querySelector(`#${newIdPrefix}_sexLinked`); if(linkageSelect) { const newLinkageSelect = linkageSelect.cloneNode(true); linkageSelect.parentNode.replaceChild(newLinkageSelect, linkageSelect); newLinkageSelect.addEventListener('change', () => updateParentalGenotypeInputs());}
            const removeBtn = block.querySelector('.remove-trait-button'); if (removeBtn) { const newBtn = removeBtn.cloneNode(true); removeBtn.parentNode.replaceChild(newBtn, removeBtn); newBtn.addEventListener('click', (e) => removeTrait(e.target.dataset.traitid));}
        });
    }

    function updateParentalGenotypeInputs() {
        const showSex = showSexDetailsCheckbox.checked; parent1GenotypeInputsDiv.innerHTML = ''; parent2GenotypeInputsDiv.innerHTML = '';
        const currentTraits = traitsContainer.querySelectorAll('.trait-block');
        currentTraits.forEach((traitBlock) => {
            const traitIdPrefix = traitBlock.id; const traitNameVal = document.getElementById(`${traitIdPrefix}_name`).value.trim() || `Trait ${traitBlock.id.replace('trait','')}`;
            const allele1SymUser = document.getElementById(`${traitIdPrefix}_allele1Symbol`).value.trim() || 'A'; const allele2SymUser = document.getElementById(`${traitIdPrefix}_allele2Symbol`).value.trim() || 'a'; 
            const dominanceSetting = document.getElementById(`${traitIdPrefix}_dominance`).value; let originalLinkType = document.getElementById(`${traitIdPrefix}_sexLinked`).value;
            let effectiveLinkType = originalLinkType; if (!showSex && (originalLinkType === 'X-linked' || originalLinkType === 'Y-linked')) { effectiveLinkType = 'autosomal'; }
            const domUserSym = dominanceSetting === 'dominant' ? allele1SymUser : allele2SymUser; const recUserSym = dominanceSetting === 'dominant' ? allele2SymUser : allele1SymUser;
            const traitDisplayLabel = `${traitNameVal} [${allele1SymUser}/${allele2SymUser}]`;
            const p1Container = document.createElement('div'); p1Container.className = 'parent-trait-genotype-selector'; p1Container.innerHTML = `<span class="trait-label">${traitDisplayLabel}:</span>`;
            if (originalLinkType === 'Y-linked' && showSex) { p1Container.innerHTML += `<span class="info-text">N/A - Trait is Y-linked for XX parent</span>`; }
            else { p1Container.appendChild(createGenotypeSelectorUI(traitIdPrefix, 'p1', allele1SymUser, allele2SymUser, domUserSym, recUserSym, effectiveLinkType, 'XX', showSex)); }
            parent1GenotypeInputsDiv.appendChild(p1Container);
            const p2Container = document.createElement('div'); p2Container.className = 'parent-trait-genotype-selector'; p2Container.innerHTML = `<span class="trait-label">${traitDisplayLabel}:</span>`;
            p2Container.appendChild(createGenotypeSelectorUI(traitIdPrefix, 'p2', allele1SymUser, allele2SymUser, domUserSym, recUserSym, effectiveLinkType, 'XY', showSex));
            parent2GenotypeInputsDiv.appendChild(p2Container);
        });
    }

    function createGenotypeSelectorUI(traitId, parentPrefix, userA1, userA2, domTrueSym, recTrueSym, linkTypeToUse, parentSexBio, showSexUI) {
        const wrapper = document.createElement('div'); const allele1SelectId = `${parentPrefix}_${traitId}_allele1_dd`; const allele2SelectId = `${parentPrefix}_${traitId}_allele2_dd`;
        let valA1_opt = userA1, valA2_opt = userA2; let dispA1_opt = userA1, dispA2_opt = userA2; 
        let valDom_btn_set = domTrueSym, valRec_btn_set = recTrueSym; let dispDom_btn_text = domTrueSym, dispRec_btn_text = recTrueSym;
        if (linkTypeToUse === 'X-linked' && showSexUI) { valA1_opt = `X${userA1}`; dispA1_opt = `X<sup>${userA1}</sup>`; valA2_opt = `X${userA2}`; dispA2_opt = `X<sup>${userA2}</sup>`; valDom_btn_set = `X${domTrueSym}`; valRec_btn_set = `X${recTrueSym}`; dispDom_btn_text = `X<sup>${domTrueSym}</sup>`; dispRec_btn_text = `X<sup>${recTrueSym}</sup>`; }
        else if (linkTypeToUse === 'Y-linked' && showSexUI && parentSexBio === 'XY') { valA1_opt = `Y${userA1}`; dispA1_opt = `Y<sup>${userA1}</sup>`; valA2_opt = `Y${userA2}`; dispA2_opt = `Y<sup>${userA2}</sup>`; valDom_btn_set = `Y${userA1}`; valRec_btn_set = `Y${userA2}`; dispDom_btn_text = `Y<sup>${userA1}</sup>`; dispRec_btn_text = `Y<sup>${userA2}</sup>`;}

        if (linkTypeToUse === 'autosomal' || (linkTypeToUse === 'X-linked' && parentSexBio === 'XX' && showSexUI) || !showSexUI) {
            wrapper.innerHTML = `<div class="allele-dropdown-container"><label for="${allele1SelectId}">Allele 1:</label><select id="${allele1SelectId}"><option value="${valA1_opt}">${dispA1_opt}</option><option value="${valA2_opt}">${dispA2_opt}</option></select></div><div class="allele-dropdown-container"><label for="${allele2SelectId}">Allele 2:</label><select id="${allele2SelectId}"><option value="${valA1_opt}">${dispA1_opt}</option><option value="${valA2_opt}" selected>${dispA2_opt}</option></select></div>`;
            const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'genotype-buttons';
            buttonsDiv.innerHTML = `<button type="button" data-val1="${valDom_btn_set}" data-val2="${valDom_btn_set}">Homozygous Dominant (${dispDom_btn_text}${dispDom_btn_text.replace(/<[^>]+>/g,'')})</button><button type="button" data-val1="${valDom_btn_set}" data-val2="${valRec_btn_set}">Heterozygous (${dispDom_btn_text}${dispRec_btn_text.replace(/<[^>]+>/g,'')})</button><button type="button" data-val1="${valRec_btn_set}" data-val2="${valRec_btn_set}">Homozygous Recessive (${dispRec_btn_text}${dispRec_btn_text.replace(/<[^>]+>/g,'')})</button>`;
            buttonsDiv.querySelectorAll('button').forEach(btn => btn.addEventListener('click', (e) => { document.getElementById(allele1SelectId).value = e.target.dataset.val1; document.getElementById(allele2SelectId).value = e.target.dataset.val2; }));
            wrapper.appendChild(buttonsDiv);
        } else if (linkTypeToUse === 'X-linked' && parentSexBio === 'XY' && showSexUI) {
            wrapper.innerHTML = `<div class="allele-dropdown-container"><label for="${allele1SelectId}">X Allele:</label><select id="${allele1SelectId}"><option value="${valA1_opt}">${dispA1_opt}</option><option value="${valA2_opt}">${dispA2_opt}</option></select></div><span class="y-chromosome-text">Y</span>`;
            const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'genotype-buttons';
            buttonsDiv.innerHTML = `<button type="button" data-val="${valDom_btn_set}">Hemizygous Dominant (${dispDom_btn_text}Y)</button><button type="button" data-val="${valRec_btn_set}">Hemizygous Recessive (${dispRec_btn_text}Y)</button>`;
            buttonsDiv.querySelectorAll('button').forEach(btn => btn.addEventListener('click', (e) => { document.getElementById(allele1SelectId).value = e.target.dataset.val; }));
            wrapper.appendChild(buttonsDiv);
        } else if (linkTypeToUse === 'Y-linked' && parentSexBio === 'XY' && showSexUI) {
            wrapper.innerHTML = `<span class="x-chromosome-text">X</span><div class="allele-dropdown-container"><label for="${allele1SelectId}">Y Allele:</label><select id="${allele1SelectId}"><option value="${valA1_opt}">${dispA1_opt}</option><option value="${valA2_opt}">${dispA2_opt}</option></select></div>`;
            const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'genotype-buttons';
            buttonsDiv.innerHTML = `<button type="button" data-val="${valA1_opt}">Allele ${userA1} on Y (X${dispA1_opt})</button><button type="button" data-val="${valA2_opt}">Allele ${userA2} on Y (X${dispA2_opt})</button>`;
            buttonsDiv.querySelectorAll('button').forEach(btn => btn.addEventListener('click', (e) => { document.getElementById(allele1SelectId).value = e.target.dataset.val; }));
            wrapper.appendChild(buttonsDiv);
        } else { wrapper.innerHTML = `<span class="info-text">Genotype input not applicable or configuration error.</span>`; }
        return wrapper;
    }
    
    function getRandomColor() { return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'); }
    function clearPreviousResults() { errorMessagesDiv.textContent = ''; p1GametesSpan.textContent = ''; p2GametesSpan.textContent = ''; punnettSquareOrTableDiv.innerHTML = ''; genoListUl.innerHTML = ''; phenoListUl.innerHTML = ''; sexRatioTextP.textContent = ''; sexRatioDiv.classList.toggle('hidden-by-toggle', !showSexDetailsCheckbox.checked); genoSortSelect.value = "alpha"; phenoSortSelect.value = "alpha"; currentGenotypicRatios = {}; currentPhenotypicRatios = {}; currentAggregateGenotypicRatios = {}; currentAggregatePhenotypicRatios = {}; }

    function getAndValidateAllInputs() {
        const showSex = showSexDetailsCheckbox.checked; errorMessagesDiv.textContent = ''; let isValid = true; const allTraitsData = [];
        const traitBlocks = traitsContainer.querySelectorAll('.trait-block');
        if (traitBlocks.length === 0) { errorMessagesDiv.innerHTML = "Please add at least one trait.<br>"; return null; }
        traitBlocks.forEach((block, index) => {
            const traitIdPrefix = block.id; const currentTraitNumForMsg = index + 1; 
            let originalLinkType = document.getElementById(`${traitIdPrefix}_sexLinked`).value;
            let effectiveLinkType = originalLinkType;
            if (!showSex && (originalLinkType === 'X-linked' || originalLinkType === 'Y-linked')) { effectiveLinkType = 'autosomal'; }
            const trait = {
                id: traitIdPrefix, name: document.getElementById(`${traitIdPrefix}_name`).value.trim(),
                allele1: { symbol: document.getElementById(`${traitIdPrefix}_allele1Symbol`).value.trim() || (String.fromCharCode(64 + currentTraitNumForMsg)), name: document.getElementById(`${traitIdPrefix}_allele1Name`).value.trim(), color: document.getElementById(`${traitIdPrefix}_allele1Color`).value },
                allele2: { symbol: document.getElementById(`${traitIdPrefix}_allele2Symbol`).value.trim() || (String.fromCharCode(96 + currentTraitNumForMsg)), name: document.getElementById(`${traitIdPrefix}_allele2Name`).value.trim(), color: document.getElementById(`${traitIdPrefix}_allele2Color`).value },
                dominance: document.getElementById(`${traitIdPrefix}_dominance`).value, linkType: effectiveLinkType, originalLinkType: originalLinkType 
            };
            if (!trait.name) {errorMessagesDiv.innerHTML += `Trait ${currentTraitNumForMsg} Name is required.<br>`; isValid = false;}
            if (!trait.allele1.symbol) {errorMessagesDiv.innerHTML += `Trait ${currentTraitNumForMsg} Allele 1 Symbol is required.<br>`; isValid = false;}
            if (!trait.allele2.symbol) {errorMessagesDiv.innerHTML += `Trait ${currentTraitNumForMsg} Allele 2 Symbol is required.<br>`; isValid = false;}
            if (trait.allele1.symbol === trait.allele2.symbol && trait.allele1.symbol) { errorMessagesDiv.innerHTML += `Trait ${currentTraitNumForMsg} allele symbols must be different.<br>`; isValid = false; }
            const alleleSymbolPattern = /^[a-zA-Z]$/; 
            if (trait.linkType === 'autosomal' || trait.linkType === 'Y-linked') { if ((trait.allele1.symbol && !alleleSymbolPattern.test(trait.allele1.symbol)) || (trait.allele2.symbol && !alleleSymbolPattern.test(trait.allele2.symbol))) { errorMessagesDiv.innerHTML += `Trait ${currentTraitNumForMsg}: For autosomal or Y-linked traits, allele symbols should be single letters.<br>`; isValid = false; } }
            else if (trait.linkType === 'X-linked') { if ((trait.allele1.symbol && !alleleSymbolPattern.test(trait.allele1.symbol)) || (trait.allele2.symbol && !alleleSymbolPattern.test(trait.allele2.symbol))) { errorMessagesDiv.innerHTML += `Trait ${currentTraitNumForMsg}: For X-linked traits, allele symbols (superscripts) should be single letters.<br>`; isValid = false; } }
            if (trait.dominance === 'dominant') { trait.dominantAlleleSymbol = trait.allele1.symbol; trait.recessiveAlleleSymbol = trait.allele2.symbol; trait.dominantPhenotype = { name: trait.allele1.name || trait.allele1.symbol, color: trait.allele1.color }; trait.recessivePhenotype = { name: trait.allele2.name || trait.allele2.symbol, color: trait.allele2.color }; }
            else { trait.dominantAlleleSymbol = trait.allele2.symbol; trait.recessiveAlleleSymbol = trait.allele1.symbol; trait.dominantPhenotype = { name: trait.allele2.name || trait.allele2.symbol, color: trait.allele2.color }; trait.recessivePhenotype = { name: trait.allele1.name || trait.allele1.symbol, color: trait.allele1.color }; }
            allTraitsData.push(trait);
        });

        const parent1AllGenotypes = []; const parent2AllGenotypes = [];
        allTraitsData.forEach((trait) => {
            let p1RawGeno = "", p2RawGeno = "";
            const p1_a1_dd = document.getElementById(`p1_${trait.id}_allele1_dd`);
            const p1_a2_dd = document.getElementById(`p1_${trait.id}_allele2_dd`);
            const p2_a1_dd = document.getElementById(`p2_${trait.id}_allele1_dd`);
            const p2_a2_dd = document.getElementById(`p2_${trait.id}_allele2_dd`);

            if (trait.originalLinkType === 'Y-linked' && showSex) { p1RawGeno = "N/A_Y_LINKED"; }
            else if (trait.linkType === 'autosomal' || (trait.linkType === 'X-linked' && parent1SexDisplay.textContent.includes("XX") && showSex) || !showSex) { 
                if (p1_a1_dd && p1_a2_dd && p1_a1_dd.value && p1_a2_dd.value) { p1RawGeno = p1_a1_dd.value + p1_a2_dd.value; }
                else if (!(trait.originalLinkType === 'Y-linked' && showSex)) { errorMessagesDiv.innerHTML += `Parent 1 genotype for ${trait.name} is incomplete.<br>`; isValid = false; }
            }

            if (trait.linkType === 'autosomal' || !showSex) { if (p2_a1_dd && p2_a2_dd && p2_a1_dd.value && p2_a2_dd.value) p2RawGeno = p2_a1_dd.value + p2_a2_dd.value; else {errorMessagesDiv.innerHTML += `Parent 2 genotype for ${trait.name} is incomplete.<br>`; isValid = false;} }
            else if (trait.linkType === 'X-linked' && showSex) { if (p2_a1_dd && p2_a1_dd.value) p2RawGeno = p2_a1_dd.value + "Y"; else {errorMessagesDiv.innerHTML += `Parent 2 X-allele for ${trait.name} is missing.<br>`; isValid = false;} }
            else if (trait.linkType === 'Y-linked' && showSex) { if (p2_a1_dd && p2_a1_dd.value) p2RawGeno = "X" + p2_a1_dd.value; else {errorMessagesDiv.innerHTML += `Parent 2 Y-allele for ${trait.name} is missing.<br>`; isValid = false;} }
            
            if (!p1RawGeno && !(trait.originalLinkType === 'Y-linked' && showSex)) { isValid = false; } 
            if (!p2RawGeno) { isValid = false; }

            if(isValid) { 
                try {
                    parent1AllGenotypes.push(parseSingleParentGenotype(p1RawGeno, trait, showSex ? 'XX' : 'N/A'));
                    parent2AllGenotypes.push(parseSingleParentGenotype(p2RawGeno, trait, showSex ? 'XY' : 'N/A'));
                } catch (e) { errorMessagesDiv.innerHTML += e.message + "<br>"; isValid = false; }
            }
        });
        if (!isValid) return null;
        return { traits: allTraitsData, parent1AllGenotypes, parent2AllGenotypes };
    }
    
    function parseSingleParentGenotype(rawGeno, trait, sexChromosomesIfAnalyzed) {
        let parsedTraitAlleles = ""; const showSex = sexChromosomesIfAnalyzed !== 'N/A'; const effectiveLinkType = trait.linkType; 
        if (effectiveLinkType === 'autosomal') {
            if (rawGeno.length === trait.allele1.symbol.length + trait.allele2.symbol.length) {
                let a1 = "", a2 = "";
                if(rawGeno.startsWith(trait.allele1.symbol) && rawGeno.substring(trait.allele1.symbol.length) === trait.allele2.symbol) { a1 = trait.allele1.symbol; a2 = trait.allele2.symbol;}
                else if (rawGeno.startsWith(trait.allele2.symbol) && rawGeno.substring(trait.allele2.symbol.length) === trait.allele1.symbol) { a1 = trait.allele2.symbol; a2 = trait.allele1.symbol;}
                else if (rawGeno.startsWith(trait.allele1.symbol) && rawGeno.substring(trait.allele1.symbol.length) === trait.allele1.symbol) { a1 = trait.allele1.symbol; a2 = trait.allele1.symbol;} 
                else if (rawGeno.startsWith(trait.allele2.symbol) && rawGeno.substring(trait.allele2.symbol.length) === trait.allele2.symbol) { a1 = trait.allele2.symbol; a2 = trait.allele2.symbol;} 
                else { parsedTraitAlleles = rawGeno; }
                if(a1 && a2) parsedTraitAlleles = [a1, a2].sort().join('');
                else if (!parsedTraitAlleles && rawGeno.length === 2 && /^[a-zA-Z]{2}$/.test(rawGeno) && trait.allele1.symbol.length === 1 && trait.allele2.symbol.length === 1) {
                     parsedTraitAlleles = [rawGeno[0], rawGeno[1]].sort().join(''); // Fallback for simple single char
                } else if (!parsedTraitAlleles) {
                    throw new Error(`Cannot parse autosomal rawGeno '${rawGeno}' with symbols '${trait.allele1.symbol}', '${trait.allele2.symbol}'`);
                }
            } else { parsedTraitAlleles = rawGeno; }
        } else if (effectiveLinkType === 'X-linked') {
            if ((sexChromosomesIfAnalyzed === 'XX' && (!rawGeno.startsWith('X') || rawGeno.indexOf('X', 1) === -1 )) ||
                (sexChromosomesIfAnalyzed === 'XY' && (!rawGeno.startsWith('X') || !rawGeno.endsWith('Y')) )) {
                throw new Error(`Invalid raw X-linked genotype: ${rawGeno} for ${sexChromosomesIfAnalyzed}`);
            }
            if (sexChromosomesIfAnalyzed === 'XX' && rawGeno.length >= 4) { 
                const parts = rawGeno.match(/X[^X]+/g); 
                if(parts && parts.length === 2) parsedTraitAlleles = parts.sort().join(''); else parsedTraitAlleles = rawGeno;
            } else { parsedTraitAlleles = rawGeno; }
        } else if (effectiveLinkType === 'Y-linked') {
            if (!showSex) throw new Error("Y-linked trait error: Sex details must be shown.");
            if (sexChromosomesIfAnalyzed === 'XX') { if (rawGeno !== "N/A_Y_LINKED") throw new Error(`XX Parent Y-linked error. Got ${rawGeno}`); parsedTraitAlleles = "N/A_Y"; }
            else if (sexChromosomesIfAnalyzed === 'XY') { 
                const expectedPrefix = "X"; 
                if (rawGeno.startsWith(expectedPrefix) && rawGeno.charAt(expectedPrefix.length) === 'Y' && rawGeno.length >= (expectedPrefix.length + 1 + 1) ) { 
                    parsedTraitAlleles = rawGeno.substring(expectedPrefix.length); 
                } else { throw new Error(`Invalid raw Y-linked genotype format for XY parent: ${rawGeno}. Expected 'X' + Y-allele format like XY[Symbol].`); }
            }
        }
        return { traitId: trait.id, raw: rawGeno, parsed: parsedTraitAlleles, linkType: effectiveLinkType };
    }

    function generateMultiTraitGametes(parentAllGenotypes, traits, sexChromosomes) {
        let individualTraitGametesList = [];
        parentAllGenotypes.forEach(pg => {
            let currentTraitGametes = []; 
            const currentTraitDef = traits.find(t => t.id === pg.traitId);
            if (pg.linkType === 'autosomal') {
                let a1 = "", a2 = "";
                if(pg.parsed.startsWith(currentTraitDef.allele1.symbol) && pg.parsed.endsWith(currentTraitDef.allele1.symbol)) { a1 = currentTraitDef.allele1.symbol; a2 = currentTraitDef.allele1.symbol; }
                else if(pg.parsed.startsWith(currentTraitDef.allele2.symbol) && pg.parsed.endsWith(currentTraitDef.allele2.symbol)) { a1 = currentTraitDef.allele2.symbol; a2 = currentTraitDef.allele2.symbol; }
                else if(pg.parsed.startsWith(currentTraitDef.allele1.symbol) && pg.parsed.endsWith(currentTraitDef.allele2.symbol)) { a1 = currentTraitDef.allele1.symbol; a2 = currentTraitDef.allele2.symbol; }
                else if(pg.parsed.startsWith(currentTraitDef.allele2.symbol) && pg.parsed.endsWith(currentTraitDef.allele1.symbol)) { a1 = currentTraitDef.allele2.symbol; a2 = currentTraitDef.allele1.symbol; }
                else {console.error("Complex autosomal parsing needed in generateMultiTraitGametes for:", pg.parsed); a1 = pg.parsed[0]; a2 = pg.parsed[1];} // Fallback for simple single char

                if (a1 === a2) { currentTraitGametes.push({ allele: a1, prob: 1 }); }
                else { currentTraitGametes.push({ allele: a1, prob: 0.5 }); currentTraitGametes.push({ allele: a2, prob: 0.5 }); }
            } else if (pg.linkType === 'X-linked') {
                if (sexChromosomes === 'XX') { 
                    const match = pg.parsed.match(/X([^X]+)X([^X]+)/); 
                    if(match && match.length === 3) { const alleleOnX1 = "X" + match[1]; const alleleOnX2 = "X" + match[2]; if (alleleOnX1 === alleleOnX2) { currentTraitGametes.push({ allele: alleleOnX1, prob: 1 }); } else { currentTraitGametes.push({ allele: alleleOnX1, prob: 0.5 }); currentTraitGametes.push({ allele: alleleOnX2, prob: 0.5 }); } }
                    else { console.error("Error parsing X-linked female genotype for gametes:", pg.parsed); currentTraitGametes.push({allele: "ErrorXF", prob: 1}); }
                } else { 
                    const match = pg.parsed.match(/X([^Y]+)Y/); 
                     if(match && match.length === 2) { const alleleOnX = "X" + match[1]; const yChromosome = "Y"; currentTraitGametes.push({ allele: alleleOnX, prob: 0.5 }); currentTraitGametes.push({ allele: yChromosome, prob: 0.5 });  }
                     else { console.error("Error parsing X-linked male genotype for gametes:", pg.parsed); currentTraitGametes.push({allele: "ErrorXM", prob: 1}); }
                }
            } else if (pg.linkType === 'Y-linked') {
                if (pg.parsed === "N/A_Y") { currentTraitGametes.push({ allele: "N/A_Y_GAMETE", prob: 1}); }
                else { currentTraitGametes.push({ allele: pg.parsed, prob: 0.5 }); currentTraitGametes.push({ allele: "N/A_X_GAMETE", prob: 0.5 }); }
            }
            individualTraitGametesList.push({traitId: pg.traitId, linkType: pg.linkType, gametes: currentTraitGametes});
        });
        let combinedGametes = [{ alleles: {}, probability: 1 }]; 
        let hasSexLinkedTraitForSexAssignment = traits.some(t => t.linkType === 'X-linked' || t.linkType === 'Y-linked');
        individualTraitGametesList.forEach(traitGameteSet => {
            const traitId = traitGameteSet.traitId; let tempCombined = [];
            combinedGametes.forEach(existingGamete => {
                traitGameteSet.gametes.forEach(newTraitAlleleGamete => {
                    let newAlleles = { ...existingGamete.alleles }; newAlleles[traitId] = newTraitAlleleGamete.allele; 
                    tempCombined.push({ alleles: newAlleles, probability: existingGamete.probability * newTraitAlleleGamete.prob });
                });
            });
            combinedGametes = tempCombined;
        });
        let finalGametesWithSex = [];
        if (sexChromosomes === 'XX') { combinedGametes.forEach(g => { g.alleles.sex = 'X'; finalGametesWithSex.push(g); }); }
        else { 
            if (!hasSexLinkedTraitForSexAssignment) { combinedGametes.forEach(g => { finalGametesWithSex.push({ alleles: {...g.alleles, sex: 'X'}, probability: g.probability * 0.5 }); finalGametesWithSex.push({ alleles: {...g.alleles, sex: 'Y'}, probability: g.probability * 0.5 }); }); }
            else { 
                combinedGametes.forEach(g => {
                    let effectiveSexChromosome = 'X';
                    traits.forEach(traitInfo => {
                        const alleleInGamete = g.alleles[traitInfo.id];
                        if (traitInfo.linkType === 'X-linked' && alleleInGamete === 'Y') { effectiveSexChromosome = 'Y';}
                        if (traitInfo.linkType === 'Y-linked' && alleleInGamete?.startsWith('Y')) { effectiveSexChromosome = 'Y';}
                        if (traitInfo.linkType === 'Y-linked' && alleleInGamete === "N/A_X_GAMETE") { effectiveSexChromosome = 'X'; }
                    });
                    g.alleles.sex = effectiveSexChromosome; finalGametesWithSex.push(g);
                });
            }
        }
        finalGametesWithSex.forEach(g => { for (const traitId in g.alleles) { if (g.alleles[traitId] === "N/A_Y_GAMETE" || g.alleles[traitId] === "N/A_X_GAMETE") { delete g.alleles[traitId]; } } });
        return finalGametesWithSex.filter(g => g.probability > 0);
    }

    function crossMultiTrait(parent1Gametes, parent2Gametes, traits) {
        const offspringMap = new Map(); 
        parent1Gametes.forEach(g1 => {
            parent2Gametes.forEach(g2 => {
                let offspringGenotypes = {}; let offspringSex;
                if (g1.alleles.sex === 'X' && g2.alleles.sex === 'X') offspringSex = 'XX';
                else if (g1.alleles.sex === 'X' && g2.alleles.sex === 'Y') offspringSex = 'XY';
                else if (g1.alleles.sex === 'Y' && g2.alleles.sex === 'X') offspringSex = 'XY';
                else if (g1.alleles.sex === 'Y' && g2.alleles.sex === 'Y') offspringSex = 'YY'; 
                else { offspringSex = '??'; }
                traits.forEach(trait => {
                    const alleleFromG1 = g1.alleles[trait.id]; const alleleFromG2 = g2.alleles[trait.id]; 
                    if (trait.linkType === 'autosomal') { if (alleleFromG1 && alleleFromG2) offspringGenotypes[trait.id] = [alleleFromG1, alleleFromG2].sort().join(''); else offspringGenotypes[trait.id] = "--"; }
                    else if (trait.linkType === 'X-linked') {
                        if (offspringSex === 'XX') { if (alleleFromG1 && alleleFromG2) offspringGenotypes[trait.id] = [alleleFromG1, alleleFromG2].sort((a,b)=>a.localeCompare(b)).join(''); else offspringGenotypes[trait.id] = "X?X?"; }
                        else if (offspringSex === 'XY') { let xAllele = alleleFromG1?.startsWith('X') ? alleleFromG1 : (alleleFromG2?.startsWith('X') ? alleleFromG2 : null); if (xAllele) offspringGenotypes[trait.id] = xAllele + "Y"; else offspringGenotypes[trait.id] = "X?Y"; }
                        else { offspringGenotypes[trait.id] = "--"; }
                    } else if (trait.linkType === 'Y-linked') {
                        if (offspringSex === 'XY') { let yLinkedAllele = null; if (g1.alleles.sex === 'Y' && alleleFromG1?.startsWith('Y')) yLinkedAllele = alleleFromG1; else if (g2.alleles.sex === 'Y' && alleleFromG2?.startsWith('Y')) yLinkedAllele = alleleFromG2; if (yLinkedAllele) offspringGenotypes[trait.id] = "X" + yLinkedAllele; else offspringGenotypes[trait.id] = "XY(--)"; }
                        else { offspringGenotypes[trait.id] = "--"; }
                    }
                });
                let genotypeKeyParts = []; traits.forEach(t => genotypeKeyParts.push(offspringGenotypes[t.id] || '--'));
                const genotypeKey = genotypeKeyParts.join(';') + ` (${offspringSex})`; const probability = g1.probability * g2.probability;
                if (offspringMap.has(genotypeKey)) { offspringMap.set(genotypeKey, offspringMap.get(genotypeKey) + probability); } else { offspringMap.set(genotypeKey, probability); }
            });
        });
        const finalOffspringList = [];
        offspringMap.forEach((prob, key) => {
            const match = key.match(/(.*) \((XX|XY|YY|\?\?)\)$/); if (!match) { console.error("Error parsing offspring key:", key); return; }
            const genoParts = match[1].split(';'); let genotypes = {}; traits.forEach((t, i) => genotypes[t.id] = genoParts[i]);
            finalOffspringList.push({ genotypes: genotypes, sex: match[2], probability: prob });
        });
        return finalOffspringList;
    }
    
    function getMultiTraitPhenotype(offspringGenotypes, offspringSex, traits) {
        let phenotypeParts = []; let phenotypeColors = [];
        traits.forEach(trait => {
            const childGenoForTrait = offspringGenotypes[trait.id]; 
            if (!childGenoForTrait || childGenoForTrait === "--" || childGenoForTrait === "N/A_Y_LINKED_OFFSPRING") { phenotypeParts.push(`(N/A - ${trait.name})`); phenotypeColors.push("#D3D3D3"); return; }
            if (childGenoForTrait.includes("?") || childGenoForTrait === "XY(--)" || childGenoForTrait === "SexError") { phenotypeParts.push(`(Undefined - ${trait.name})`); phenotypeColors.push("#A9A9A9"); return; }
            if (trait.linkType === 'autosomal') { if (childGenoForTrait.includes(trait.dominantAlleleSymbol)) { phenotypeParts.push(trait.dominantPhenotype.name); phenotypeColors.push(trait.dominantPhenotype.color); } else { phenotypeParts.push(trait.recessivePhenotype.name); phenotypeColors.push(trait.recessivePhenotype.color); } }
            else if (trait.linkType === 'X-linked') {
                if (offspringSex === 'XX') { if (childGenoForTrait.includes(`X${trait.dominantAlleleSymbol}`)) { phenotypeParts.push(trait.dominantPhenotype.name); phenotypeColors.push(trait.dominantPhenotype.color); } else { phenotypeParts.push(trait.recessivePhenotype.name); phenotypeColors.push(trait.recessivePhenotype.color); } }
                else if (offspringSex === 'XY'){ if (childGenoForTrait.startsWith(`X${trait.dominantAlleleSymbol}`)) { phenotypeParts.push(trait.dominantPhenotype.name); phenotypeColors.push(trait.dominantPhenotype.color); } else if (childGenoForTrait.startsWith(`X${trait.recessiveAlleleSymbol}`)) { phenotypeParts.push(trait.recessivePhenotype.name); phenotypeColors.push(trait.recessivePhenotype.color); } else { phenotypeParts.push(`(No X-allele - ${trait.name})`); phenotypeColors.push("#D3D3D3"); } }
                else { phenotypeParts.push(`(N/A - ${trait.name})`); phenotypeColors.push("#D3D3D3"); }
            } else if (trait.linkType === 'Y-linked') {
                if (offspringSex === 'XY' && childGenoForTrait.startsWith('XY')) { 
                    const yAlleleSymbolOnly = childGenoForTrait.substring(2); 
                    if (yAlleleSymbolOnly === trait.allele1.symbol) { phenotypeParts.push(trait.allele1.name); phenotypeColors.push(trait.allele1.color); }
                    else if (yAlleleSymbolOnly === trait.allele2.symbol) { phenotypeParts.push(trait.allele2.name); phenotypeColors.push(trait.allele2.color); }
                    else { phenotypeParts.push(`(Y-linked: ${yAlleleSymbolOnly})`); phenotypeColors.push("#A9A9A9"); }
                } else if (offspringSex === 'XX') { phenotypeParts.push(`(N/A - ${trait.name})`); phenotypeColors.push("#D3D3D3"); }
                else { phenotypeParts.push(`(N/A - ${trait.name})`); phenotypeColors.push("#D3D3D3"); } 
            }
        });
        return { names: phenotypeParts, colors: phenotypeColors };
    }
    
    function analyzeMultiTraitOffspring(offspring, traits) {
        const sexSpecificGenotypicRatios = {}; const sexSpecificPhenotypicRatios = {}; 
        const aggregateGenotypicRatios = {}; const aggregatePhenotypicRatios = {}; 
        let femaleCount = 0; let maleCount = 0; let otherSexCount = 0; 
        const totalOffspringProb = offspring.reduce((sum, o) => sum + o.probability, 0);
        offspring.forEach(child => {
            let genoKeyParts = []; traits.forEach(t => genoKeyParts.push(child.genotypes[t.id] || '--')); 
            const aggregateGenoKey = genoKeyParts.join('; ');
            aggregateGenotypicRatios[aggregateGenoKey] = (aggregateGenotypicRatios[aggregateGenoKey] || 0) + child.probability;
            const sexString = child.sex === 'XX' ? '<span class="female-text">Female ♀</span>' : child.sex === 'XY' ? '<span class="male-text">Male ♂</span>' : `<span style="color:orange;">${child.sex}</span>`;
            const sexSpecificGenoKey = `${aggregateGenoKey} (${sexString})`;
            sexSpecificGenotypicRatios[sexSpecificGenoKey] = (sexSpecificGenotypicRatios[sexSpecificGenoKey] || 0) + child.probability;
            const phenotypeResult = getMultiTraitPhenotype(child.genotypes, child.sex, traits);
            const aggregatePhenoKey = phenotypeResult.names.join(', ');
            aggregatePhenotypicRatios[aggregatePhenoKey] = (aggregatePhenotypicRatios[aggregatePhenoKey] || 0) + child.probability;
            let phenoDisplayParts = []; phenotypeResult.names.forEach((name, i) => { phenoDisplayParts.push(`<span class="phenotype-display" style="background-color:${phenotypeResult.colors[i]};">${name}</span>`); });
            const sexSpecificPhenoKey = phenoDisplayParts.join(', ') + ` (${sexString})`;
            sexSpecificPhenotypicRatios[sexSpecificPhenoKey] = (sexSpecificPhenotypicRatios[sexSpecificPhenoKey] || 0) + child.probability;
            if (child.sex === 'XX') femaleCount += child.probability; else if (child.sex === 'XY') maleCount += child.probability; else otherSexCount += child.probability;
        });
        const normalize = (ratiosObj, totalProb) => { if (totalProb > 0 && Math.abs(totalProb - 1.0) > 1e-9) { for (const key in ratiosObj) ratiosObj[key] /= totalProb; } };
        normalize(sexSpecificGenotypicRatios, totalOffspringProb); normalize(sexSpecificPhenotypicRatios, totalOffspringProb);
        normalize(aggregateGenotypicRatios, totalOffspringProb); normalize(aggregatePhenotypicRatios, totalOffspringProb);
        if(totalOffspringProb > 0 && Math.abs(totalOffspringProb - 1.0) > 1e-9) { femaleCount /= totalOffspringProb; maleCount /= totalOffspringProb; if(otherSexCount > 0) otherSexCount /= totalOffspringProb; }
        return { genotypicRatios: sexSpecificGenotypicRatios, phenotypicRatios: sexSpecificPhenotypicRatios, aggregateGenotypicRatios, aggregatePhenotypicRatios, overallSexRatio: { female: femaleCount, male: maleCount, other: otherSexCount } };
    }

    function displayGametes(p1Gametes, p2Gametes, traits, showSexDetails) {
        p1GametesSpan.innerHTML = p1Gametes.map(g => formatGameteForDisplay(g, traits, showSexDetails)).join(',&nbsp; ');
        p2GametesSpan.innerHTML = p2Gametes.map(g => formatGameteForDisplay(g, traits, showSexDetails)).join(',&nbsp; ');
    }

    function formatGameteForDisplay(gamete, traits, showSexDetails) {
        let displayParts = []; let sexFromAllele = ""; 
        traits.forEach(trait => {
            const alleleForTrait = gamete.alleles[trait.id];
            if (alleleForTrait) {
                displayParts.push(alleleForTrait);
                if (trait.linkType === 'X-linked' || trait.linkType === 'Y-linked') { 
                    if (alleleForTrait.startsWith('X')) sexFromAllele = 'X';
                    else if (alleleForTrait.startsWith('Y')) sexFromAllele = 'Y'; 
                    else if (alleleForTrait === 'Y') sexFromAllele = 'Y'; 
                }
            }
        });
        let autosomalParts = []; let xLinkedParts = []; let yLinkedParts = [];
        displayParts.forEach(dp => {
            if (dp.startsWith('X')) xLinkedParts.push(dp);
            else if (dp.startsWith('Y')) yLinkedParts.push(dp); 
            else autosomalParts.push(dp);
        });
        autosomalParts.sort(); xLinkedParts.sort(); yLinkedParts.sort(); 
        let finalDisplayString = autosomalParts.join('') + xLinkedParts.join('') + yLinkedParts.join('');
        if (showSexDetails && gamete.alleles.sex) {
            const determinedSex = gamete.alleles.sex;
            if (sexFromAllele !== determinedSex && !finalDisplayString.includes(determinedSex) ) { finalDisplayString += determinedSex; }
            else if (xLinkedParts.length === 0 && yLinkedParts.length === 0) { finalDisplayString += determinedSex; }
        }
        return `${finalDisplayString} (${(gamete.probability * 100).toFixed(1)}%)`;
    }
    
    function displayPunnettSquare(parent1Gametes, parent2Gametes, trait, showSexDetails) {
        punnettSquareOrTableDiv.innerHTML = '<table id="punnettTable"></table>'; const punnettTable = document.getElementById('punnettTable'); if (!punnettTable) return;
        const p1UniqueGametes = uniqueGametesForDisplay(parent1Gametes, [trait], showSexDetails);
        const p2UniqueGametes = uniqueGametesForDisplay(parent2Gametes, [trait], showSexDetails);
        const header = punnettTable.insertRow(); header.insertCell();
        p2UniqueGametes.forEach(g2 => { const th = document.createElement('th'); th.className = 'gamete-header'; th.innerHTML = formatGameteForDisplay(g2, [trait], showSexDetails).replace(/ \(\d+(\.\d+)?%\)/, ''); header.appendChild(th); });
        p1UniqueGametes.forEach(g1 => {
            const row = punnettTable.insertRow(); const th = document.createElement('th'); th.className = 'gamete-header'; th.innerHTML = formatGameteForDisplay(g1, [trait], showSexDetails).replace(/ \(\d+(\.\d+)?%\)/, ''); row.appendChild(th);
            p2UniqueGametes.forEach(g2 => {
                const cell = row.insertCell(); let offspringSex = 'N/A'; 
                let bioSexForPheno = 'XX'; 
                if (showSexDetails) { 
                    if (g1.alleles.sex === 'X' && g2.alleles.sex === 'X') {offspringSex = 'XX'; bioSexForPheno = 'XX';}
                    else if (g1.alleles.sex === 'X' && g2.alleles.sex === 'Y') {offspringSex = 'XY'; bioSexForPheno = 'XY';}
                    else if (g1.alleles.sex === 'Y' && g2.alleles.sex === 'X') {offspringSex = 'XY'; bioSexForPheno = 'XY';}
                    else {offspringSex = '??'; bioSexForPheno = '??';}
                } else { 
                    if (g1.alleles.sex === 'X' && g2.alleles.sex === 'X') bioSexForPheno = 'XX';
                    else if ((g1.alleles.sex === 'X' && g2.alleles.sex === 'Y') || (g1.alleles.sex === 'Y' && g2.alleles.sex === 'X')) bioSexForPheno = 'XY';
                    else bioSexForPheno = '??';
                }
                let offspringTraitAllele; const g1Allele = g1.alleles[trait.id]; const g2Allele = g2.alleles[trait.id];
                if (trait.linkType === 'autosomal' || !showSexDetails) { 
                    if(g1Allele && g2Allele) offspringTraitAllele = [g1Allele, g2Allele].sort().join(''); else offspringTraitAllele = "--";
                } else if (trait.linkType === 'X-linked') { 
                     if (offspringSex === 'XX') { if(g1Allele && g2Allele) offspringTraitAllele = [g1Allele, g2Allele].sort((a,b)=>a.localeCompare(b)).join(''); else offspringTraitAllele = "X?X?"; }
                     else if (offspringSex === 'XY') { let xGameteAllele = g1Allele?.startsWith('X') ? g1Allele : (g2Allele?.startsWith('X') ? g2Allele : null); if(xGameteAllele) offspringTraitAllele = xGameteAllele + "Y"; else offspringTraitAllele = "X?Y"; }
                     else { offspringTraitAllele = "--"; }
                } else if (trait.linkType === 'Y-linked') {
                    if (offspringSex === 'XY') { let yGameteAllele = g1Allele?.startsWith('Y') ? g1Allele : (g2Allele?.startsWith('Y') ? g2Allele : null); if(yGameteAllele) offspringTraitAllele = "X" + yGameteAllele; else offspringTraitAllele = "XY(--)"; }
                    else { offspringTraitAllele = "--"; }
                }
                const phenotypeResult = getMultiTraitPhenotype({ [trait.id]: offspringTraitAllele }, bioSexForPheno, [trait]); 
                const phenotypeDisplay = `<span class="phenotype-display" style="background-color:${phenotypeResult.colors[0]};">${phenotypeResult.names[0]}</span>`;
                const probabilityOfThisCell = g1.probability * g2.probability;
                const sexSymbol = showSexDetails ? (offspringSex === 'XX' ? '<span class="female-symbol">♀</span>' : offspringSex === 'XY' ? '<span class="male-symbol">♂</span>' : '') : '';
                cell.innerHTML = `${offspringTraitAllele || "--"} ${sexSymbol}<br>${phenotypeDisplay}<br><small>(${(probabilityOfThisCell * 100).toFixed(1)}%)</small>`;
            });
        });
    }
    
    function uniqueGametesForDisplay(gametes, traits, showSexDetails) {
        const unique = []; const seenKeys = new Set();
        gametes.forEach(g => { const key = formatGameteForDisplay(g, traits, showSexDetails); if (!seenKeys.has(key)) { seenKeys.add(key); unique.push(g); } });
        unique.sort((a,b) => { const keyA = formatGameteForDisplay(a, traits, showSexDetails); const keyB = formatGameteForDisplay(b, traits, showSexDetails); return keyA.localeCompare(keyB); });
        return unique;
    }

    function displayProbabilityTable(offspring, traits, showSexDetails) {
        let tableHTML = `<table class="probability-table"><thead><tr><th>Offspring Genotype(s)</th><th>Offspring Phenotype(s)</th>${showSexDetails ? '<th>Sex</th>' : ''}<th>Probability</th></tr></thead><tbody>`;
        const sortedOffspring = [...offspring].sort((a, b) => { let keyA = traits.map(t => a.genotypes[t.id] || '--').join(';') + a.sex; let keyB = traits.map(t => b.genotypes[t.id] || '--').join(';') + b.sex; return keyA.localeCompare(keyB); });
        sortedOffspring.forEach(child => {
            let genoStrings = []; traits.forEach(t => genoStrings.push(child.genotypes[t.id] || '--'));
            const phenotypeResult = getMultiTraitPhenotype(child.genotypes, child.sex, traits);
            let phenoDisplays = []; phenotypeResult.names.forEach((name, i) => { phenoDisplays.push(`<span class="phenotype-display" style="background-color:${phenotypeResult.colors[i]};">${name}</span>`); });
            const sexDisplay = showSexDetails ? (child.sex === 'XX' ? '<span class="female-text">Female ♀</span>' : child.sex === 'XY' ? '<span class="male-text">Male ♂</span>' : `<span style="color:orange;">${child.sex}</span>`) : '';
            tableHTML += `<tr><td>${genoStrings.join('; ')}</td><td>${phenoDisplays.join(', ')}</td>${showSexDetails ? `<td>${sexDisplay}</td>` : ''}<td>${(child.probability * 100).toFixed(2)}%</td></tr>`;
        });
        tableHTML += `</tbody></table>`; punnettSquareOrTableDiv.innerHTML = tableHTML;
    }

    function displayGenotypicRatios(sexSpecificRatios, aggregateRatios, showSexDetails, sortBy = 'alpha') { 
        genoListUl.innerHTML = '';
        const sortAndDisplay = (ratiosObj, title) => {
            if (Object.keys(ratiosObj).length === 0) return;
            let sortedArray = Object.entries(ratiosObj); 
            if (sortBy === 'percent_desc') { sortedArray.sort(([,aValue], [,bValue]) => bValue - aValue); }
            else if (sortBy === 'percent_asc') { sortedArray.sort(([,aValue], [,bValue]) => aValue - bValue); }
            else { sortedArray.sort(([aKey], [bKey]) => aKey.localeCompare(bKey)); }
            const titleLi = document.createElement('li'); titleLi.innerHTML = `<strong>${title}:</strong>`; genoListUl.appendChild(titleLi);
            sortedArray.forEach(([key, value]) => { const li = document.createElement('li'); li.innerHTML = `${key}: ${(value * 100).toFixed(2)}%`; genoListUl.appendChild(li); });
        };
        if (showSexDetails) { sortAndDisplay(sexSpecificRatios, "Sex-Specific Genotypic Ratios"); }
        sortAndDisplay(aggregateRatios, "Aggregate Genotypic Ratios (Total)");
    }

    function displayPhenotypicRatios(sexSpecificRatios, aggregateRatios, showSexDetails, sortBy = 'alpha') { 
        phenoListUl.innerHTML = '';
        const stripHtml = (html) => (new DOMParser().parseFromString(html, 'text/html')).body.textContent || "";
        const sortAndDisplay = (ratiosObj, title) => {
            if (Object.keys(ratiosObj).length === 0) return;
            let sortedArray = Object.entries(ratiosObj);
            if (sortBy === 'percent_desc') { sortedArray.sort(([,aValue], [,bValue]) => bValue - aValue); }
            else if (sortBy === 'percent_asc') { sortedArray.sort(([,aValue], [,bValue]) => aValue - bValue); }
            else { sortedArray.sort(([aKey], [bKey]) => stripHtml(aKey).localeCompare(stripHtml(bKey))); }
            const titleLi = document.createElement('li'); titleLi.innerHTML = `<strong>${title}:</strong>`; phenoListUl.appendChild(titleLi);
            sortedArray.forEach(([key, value]) => { const li = document.createElement('li'); li.innerHTML = `${key}: ${(value * 100).toFixed(2)}%`; phenoListUl.appendChild(li); });
        };
        if (showSexDetails) { sortAndDisplay(sexSpecificRatios, "Sex-Specific Phenotypic Ratios"); }
        sortAndDisplay(aggregateRatios, "Aggregate Phenotypic Ratios (Total)");
    }

    function displaySexRatio(ratio) { 
        let ratioText = `<span class="female-text">Female ♀</span>: ${(ratio.female * 100).toFixed(2)}%, <span class="male-text">Male ♂</span>: ${(ratio.male * 100).toFixed(2)}%`;
        if (ratio.other && ratio.other > 1e-9) { ratioText += `, <span style="color:orange;">Other</span>: ${(ratio.other * 100).toFixed(2)}%`; }
        sexRatioTextP.innerHTML = ratioText;
    }
});