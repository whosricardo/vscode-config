'use strict';
const elementId = {
    configName: "configName",
    configNameInvalid: "configNameInvalid",
    configSelection: "configSelection",
    addConfigDiv: "addConfigDiv",
    addConfigBtn: "addConfigBtn",
    addConfigInputDiv: "addConfigInputDiv",
    addConfigOk: "addConfigOk",
    addConfigCancel: "addConfigCancel",
    addConfigName: "addConfigName",
    compilerPath: "compilerPath",
    compilerPathInvalid: "compilerPathInvalid",
    knownCompilers: "knownCompilers",
    noCompilerPathsDetected: "noCompilerPathsDetected",
    compilerArgs: "compilerArgs",
    intelliSenseMode: "intelliSenseMode",
    intelliSenseModeInvalid: "intelliSenseModeInvalid",
    includePath: "includePath",
    includePathInvalid: "includePathInvalid",
    defines: "defines",
    cStandard: "cStandard",
    cppStandard: "cppStandard",
    windowsSdkVersion: "windowsSdkVersion",
    macFrameworkPath: "macFrameworkPath",
    macFrameworkPathInvalid: "macFrameworkPathInvalid",
    compileCommands: "compileCommands",
    compileCommandsInvalid: "compileCommandsInvalid",
    configurationProvider: "configurationProvider",
    forcedInclude: "forcedInclude",
    forcedIncludeInvalid: "forcedIncludeInvalid",
    mergeConfigurations: "mergeConfigurations",
    dotConfig: "dotConfig",
    dotConfigInvalid: "dotConfigInvalid",
    recursiveIncludesReduce: "recursiveIncludes.reduce",
    recursiveIncludesPriority: "recursiveIncludes.priority",
    recursiveIncludesOrder: "recursiveIncludes.order",
    browsePath: "browsePath",
    browsePathInvalid: "browsePathInvalid",
    limitSymbolsToIncludedHeaders: "limitSymbolsToIncludedHeaders",
    databaseFilename: "databaseFilename",
    databaseFilenameInvalid: "databaseFilenameInvalid",
    showAdvanced: "showAdvanced",
    advancedSection: "advancedSection"
};
class SettingsApp {
    vsCodeApi;
    updating = false;
    constructor() {
        this.vsCodeApi = acquireVsCodeApi();
        window.addEventListener("keydown", this.onTabKeyDown.bind(this));
        window.addEventListener("message", this.onMessageReceived.bind(this));
        this.addEventsToConfigNameChanges();
        this.addEventsToInputValues();
        document.getElementById(elementId.knownCompilers)?.addEventListener("change", this.onKnownCompilerSelect.bind(this));
        const oldState = this.vsCodeApi.getState();
        const advancedShown = oldState && oldState.advancedShown;
        const advancedSection = document.getElementById(elementId.advancedSection);
        if (advancedSection) {
            advancedSection.style.display = advancedShown ? "block" : "none";
        }
        document.getElementById(elementId.showAdvanced)?.classList.toggle(advancedShown ? "collapse" : "expand", true);
        document.getElementById(elementId.showAdvanced)?.addEventListener("click", this.onShowAdvanced.bind(this));
        this.vsCodeApi.postMessage({
            command: "initialized"
        });
    }
    addEventsToInputValues() {
        const elements = document.getElementsByName("inputValue");
        elements.forEach(el => {
            el.addEventListener("change", this.onChanged.bind(this, el.id));
        });
        document.getElementById(elementId.limitSymbolsToIncludedHeaders)?.addEventListener("change", this.onChangedCheckbox.bind(this, elementId.limitSymbolsToIncludedHeaders));
        document.getElementById(elementId.mergeConfigurations)?.addEventListener("change", this.onChangedCheckbox.bind(this, elementId.mergeConfigurations));
    }
    addEventsToConfigNameChanges() {
        document.getElementById(elementId.configName)?.addEventListener("change", this.onConfigNameChanged.bind(this));
        document.getElementById(elementId.configSelection)?.addEventListener("change", this.onConfigSelect.bind(this));
        document.getElementById(elementId.addConfigBtn)?.addEventListener("click", this.onAddConfigBtn.bind(this));
        document.getElementById(elementId.addConfigOk)?.addEventListener("click", this.onAddConfigConfirm.bind(this, true));
        document.getElementById(elementId.addConfigCancel)?.addEventListener("click", this.onAddConfigConfirm.bind(this, false));
    }
    onTabKeyDown(e) {
        if (e.keyCode === 9) {
            document.body.classList.add("tabbing");
            window.removeEventListener("keydown", this.onTabKeyDown);
            window.addEventListener("mousedown", this.onMouseDown.bind(this));
        }
    }
    onMouseDown() {
        document.body.classList.remove("tabbing");
        window.removeEventListener("mousedown", this.onMouseDown);
        window.addEventListener("keydown", this.onTabKeyDown.bind(this));
    }
    onShowAdvanced() {
        const isShown = document.getElementById(elementId.advancedSection).style.display === "block";
        document.getElementById(elementId.advancedSection).style.display = isShown ? "none" : "block";
        this.vsCodeApi.setState({ advancedShown: !isShown });
        const element = document.getElementById(elementId.showAdvanced);
        element.classList.toggle("collapse");
        element.classList.toggle("expand");
    }
    onAddConfigBtn() {
        this.showElement(elementId.addConfigDiv, false);
        this.showElement(elementId.addConfigInputDiv, true);
    }
    onAddConfigConfirm(request) {
        this.showElement(elementId.addConfigInputDiv, false);
        this.showElement(elementId.addConfigDiv, true);
        if (request) {
            const el = document.getElementById(elementId.addConfigName);
            if (el.value !== undefined && el.value !== "") {
                this.vsCodeApi.postMessage({
                    command: "addConfig",
                    name: el.value
                });
                el.value = "";
            }
        }
    }
    onConfigNameChanged() {
        if (this.updating) {
            return;
        }
        const configName = document.getElementById(elementId.configName);
        const list = document.getElementById(elementId.configSelection);
        if (configName.value === "") {
            document.getElementById(elementId.configName).value = list.options[list.selectedIndex].value;
            return;
        }
        list.options[list.selectedIndex].value = configName.value;
        list.options[list.selectedIndex].text = configName.value;
        this.onChanged(elementId.configName);
    }
    onConfigSelect() {
        if (this.updating) {
            return;
        }
        const el = document.getElementById(elementId.configSelection);
        document.getElementById(elementId.configName).value = el.value;
        this.vsCodeApi.postMessage({
            command: "configSelect",
            index: el.selectedIndex
        });
    }
    onKnownCompilerSelect() {
        if (this.updating) {
            return;
        }
        const el = document.getElementById(elementId.knownCompilers);
        document.getElementById(elementId.compilerPath).value = el.value;
        this.onChanged(elementId.compilerPath);
        this.vsCodeApi.postMessage({
            command: "knownCompilerSelect"
        });
    }
    fixKnownCompilerSelection() {
        const compilerPath = document.getElementById(elementId.compilerPath).value.toLowerCase();
        const knownCompilers = document.getElementById(elementId.knownCompilers);
        for (let n = 0; n < knownCompilers.options.length; n++) {
            if (compilerPath === knownCompilers.options[n].value.toLowerCase()) {
                knownCompilers.value = knownCompilers.options[n].value;
                return;
            }
        }
        knownCompilers.value = '';
    }
    onChangedCheckbox(id) {
        if (this.updating) {
            return;
        }
        const el = document.getElementById(id);
        this.vsCodeApi.postMessage({
            command: "change",
            key: id,
            value: el.checked
        });
    }
    onChanged(id) {
        if (this.updating) {
            return;
        }
        const el = document.getElementById(id);
        if (id === elementId.compilerPath) {
            this.fixKnownCompilerSelection();
        }
        this.vsCodeApi.postMessage({
            command: "change",
            key: id,
            value: el.value
        });
    }
    onMessageReceived(e) {
        const message = e.data;
        switch (message.command) {
            case 'updateConfig':
                this.updateConfig(message.config);
                break;
            case 'updateErrors':
                this.updateErrors(message.errors);
                break;
            case 'setKnownCompilers':
                this.setKnownCompilers(message.compilers);
                break;
            case 'updateConfigSelection':
                this.updateConfigSelection(message);
                break;
        }
    }
    updateConfig(config) {
        this.updating = true;
        try {
            const joinEntries = (input) => (input && input.length) ? input.join("\n") : "";
            document.getElementById(elementId.configName).value = config.name;
            document.getElementById(elementId.compilerPath).value = config.compilerPath ?? "";
            this.fixKnownCompilerSelection();
            document.getElementById(elementId.compilerArgs).value = joinEntries(config.compilerArgs);
            document.getElementById(elementId.intelliSenseMode).value = config.intelliSenseMode ?? "${default}";
            document.getElementById(elementId.includePath).value = joinEntries(config.includePath);
            document.getElementById(elementId.defines).value = joinEntries(config.defines);
            document.getElementById(elementId.cStandard).value = config.cStandard;
            document.getElementById(elementId.cppStandard).value = config.cppStandard;
            document.getElementById(elementId.windowsSdkVersion).value = config.windowsSdkVersion ?? "";
            document.getElementById(elementId.macFrameworkPath).value = joinEntries(config.macFrameworkPath);
            document.getElementById(elementId.compileCommands).value = joinEntries(config.compileCommands);
            document.getElementById(elementId.mergeConfigurations).checked = config.mergeConfigurations;
            document.getElementById(elementId.configurationProvider).value = config.configurationProvider ?? "";
            document.getElementById(elementId.forcedInclude).value = joinEntries(config.forcedInclude);
            document.getElementById(elementId.dotConfig).value = config.dotConfig ?? "";
            if (config.recursiveIncludes) {
                document.getElementById(elementId.recursiveIncludesReduce).value = config.recursiveIncludes.reduce ?? "${default}";
                document.getElementById(elementId.recursiveIncludesPriority).value = config.recursiveIncludes.priority ?? "${default}";
                document.getElementById(elementId.recursiveIncludesOrder).value = config.recursiveIncludes.order ?? "${default}";
            }
            if (config.browse) {
                document.getElementById(elementId.browsePath).value = joinEntries(config.browse.path);
                document.getElementById(elementId.limitSymbolsToIncludedHeaders).checked =
                    config.browse.limitSymbolsToIncludedHeaders && config.browse.limitSymbolsToIncludedHeaders;
                document.getElementById(elementId.databaseFilename).value = config.browse.databaseFilename ?? "";
            }
            else {
                document.getElementById(elementId.browsePath).value = "";
                document.getElementById(elementId.limitSymbolsToIncludedHeaders).checked = false;
                document.getElementById(elementId.databaseFilename).value = "";
            }
        }
        finally {
            this.updating = false;
        }
    }
    updateErrors(errors) {
        this.updating = true;
        try {
            this.showErrorWithInfo(elementId.configNameInvalid, errors.name);
            this.showErrorWithInfo(elementId.intelliSenseModeInvalid, errors.intelliSenseMode);
            this.showErrorWithInfo(elementId.compilerPathInvalid, errors.compilerPath);
            this.showErrorWithInfo(elementId.includePathInvalid, errors.includePath);
            this.showErrorWithInfo(elementId.macFrameworkPathInvalid, errors.macFrameworkPath);
            this.showErrorWithInfo(elementId.forcedIncludeInvalid, errors.forcedInclude);
            this.showErrorWithInfo(elementId.compileCommandsInvalid, errors.compileCommands);
            this.showErrorWithInfo(elementId.browsePathInvalid, errors.browsePath);
            this.showErrorWithInfo(elementId.databaseFilenameInvalid, errors.databaseFilename);
            this.showErrorWithInfo(elementId.dotConfigInvalid, errors.dotConfig);
        }
        finally {
            this.updating = false;
        }
    }
    showErrorWithInfo(elementID, errorInfo) {
        this.showElement(elementID, errorInfo ? true : false);
        document.getElementById(elementID).textContent = errorInfo ? errorInfo : "";
    }
    updateConfigSelection(message) {
        this.updating = true;
        try {
            const list = document.getElementById(elementId.configSelection);
            list.options.length = 0;
            for (const name of message.selections) {
                const option = document.createElement("option");
                option.text = name;
                option.value = name;
                list.append(option);
            }
            list.selectedIndex = message.selectedIndex;
        }
        finally {
            this.updating = false;
        }
    }
    setKnownCompilers(compilers) {
        this.updating = true;
        try {
            const list = document.getElementById(elementId.knownCompilers);
            if (list.firstChild) {
                return;
            }
            if (compilers.length === 0) {
                const noCompilerSpan = document.getElementById(elementId.noCompilerPathsDetected);
                const option = document.createElement("option");
                option.text = noCompilerSpan.textContent ?? "";
                option.disabled = true;
                list.append(option);
            }
            else {
                for (const path of compilers) {
                    const option = document.createElement("option");
                    option.text = path;
                    option.value = path;
                    list.append(option);
                }
            }
            this.showElement(elementId.compilerPath, true);
            this.showElement(elementId.knownCompilers, true);
            list.value = "";
        }
        finally {
            this.updating = false;
        }
    }
    showElement(elementID, show) {
        document.getElementById(elementID).style.display = show ? "block" : "none";
    }
}
const app = new SettingsApp();
//# sourceMappingURL=settings.js.map
// SIG // Begin signature block
// SIG // MIIoUAYJKoZIhvcNAQcCoIIoQTCCKD0CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // o347hXdmXem8BAMqmSQcDX9APRP4q6HNIq1daBO7A2Og
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAABAO91ZVdDzsYrQAA
// SIG // AAAEAzANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExM1oX
// SIG // DTI1MDkxMTIwMTExM1owdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // n3RnXcCDp20WFMoNNzt4s9fV12T5roRJlv+bshDfvJoM
// SIG // ZfhyRnixgUfGAbrRlS1St/EcXFXD2MhRkF3CnMYIoeMO
// SIG // MuMyYtxr2sC2B5bDRMUMM/r9I4GP2nowUthCWKFIS1RP
// SIG // lM0YoVfKKMaH7bJii29sW+waBUulAKN2c+Gn5znaiOxR
// SIG // qIu4OL8f9DCHYpME5+Teek3SL95sH5GQhZq7CqTdM0fB
// SIG // w/FmLLx98SpBu7v8XapoTz6jJpyNozhcP/59mi/Fu4tT
// SIG // 2rI2vD50Vx/0GlR9DNZ2py/iyPU7DG/3p1n1zluuRp3u
// SIG // XKjDfVKH7xDbXcMBJid22a3CPbuC2QJLowIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFOpuKgJKc+OuNYitoqxfHlrE
// SIG // gXAZMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis1MDI5MjYwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBRaP+hOC1+dSKhbqCr1LIvNEMrRiOQ
// SIG // EkPc7D6QWtM+/IbrYiXesNeeCZHCMf3+6xASuDYQ+AyB
// SIG // TX0YlXSOxGnBLOzgEukBxezbfnhUTTk7YB2/TxMUcuBC
// SIG // P45zMM0CVTaJE8btloB6/3wbFrOhvQHCILx41jTd6kUq
// SIG // 4bIBHah3NG0Q1H/FCCwHRGTjAbyiwq5n/pCTxLz5XYCu
// SIG // 4RTvy/ZJnFXuuwZynowyju90muegCToTOwpHgE6yRcTv
// SIG // Ri16LKCr68Ab8p8QINfFvqWoEwJCXn853rlkpp4k7qzw
// SIG // lBNiZ71uw2pbzjQzrRtNbCFQAfmoTtsHFD2tmZvQIg1Q
// SIG // VkzM/V1KCjHL54ItqKm7Ay4WyvqWK0VIEaTbdMtbMWbF
// SIG // zq2hkRfJTNnFr7RJFeVC/k0DNaab+bpwx5FvCUvkJ3z2
// SIG // wfHWVUckZjEOGmP7cecefrF+rHpif/xW4nJUjMUiPsyD
// SIG // btY2Hq3VMLgovj+qe0pkJgpYQzPukPm7RNhbabFNFvq+
// SIG // kXWBX/z/pyuo9qLZfTb697Vi7vll5s/DBjPtfMpyfpWG
// SIG // 0phVnAI+0mM4gH09LCMJUERZMgu9bbCGVIQR7cT5YhlL
// SIG // t+tpSDtC6XtAzq4PJbKZxFjpB5wk+SRJ1gm87olbfEV9
// SIG // SFdO7iL3jWbjgVi1Qs1iYxBmvh4WhLWr48uouzCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghojMIIaHwIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCAeeAW2rOiuYS3L
// SIG // c2Groax1famxG87xOdkG+aFMy83sFTBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAAmYmT1ryXJ38ZxfF4zOgiviweSrBtgw
// SIG // 3MOTf5RkvfWc6R1HdKJ9MenfcPffPdXLoqxJUDeZ5llU
// SIG // 8sI/8p/5YV1GQ31PdFkoEatymOOPMYIBn4yJ3+fRHnlS
// SIG // q9IE6J4QijtmXRPTX7+raixmdhMV9bm6mht2tq0l4rWZ
// SIG // gmIFW10Mjqg7TbBK6YWLMW6Vr4rs0k2vyG6JWRfmHQui
// SIG // elYXfdBPJcc0qqNwNEdLrSuVdZe2lfGGRzPE7c2LrcDJ
// SIG // XAqX0Lnlp0VDW/T+aC174pBo4rIkNNouYEQIvISC69iI
// SIG // vGGbmI+tEI/KDjoriHeTlsoqRo22fvxAREsz+ahi2j+d
// SIG // FhWhghetMIIXqQYKKwYBBAGCNwMDATGCF5kwgheVBgkq
// SIG // hkiG9w0BBwKggheGMIIXggIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBWgYLKoZIhvcNAQkQAQSgggFJBIIBRTCCAUEC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // 1sFRqgXehcwCS5gdO9zTt9Y6bo2HcZfSldJJrXZkQq4C
// SIG // BmgKts4bExgTMjAyNTA0MjgyMjEzNTMuMzQ2WjAEgAIB
// SIG // 9KCB2aSB1jCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsG
// SIG // A1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9u
// SIG // cyBMaW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBF
// SIG // U046NDAxQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFNlcnZpY2WgghH7MIIHKDCC
// SIG // BRCgAwIBAgITMwAAAf7QqMJ7NCELAQABAAAB/jANBgkq
// SIG // hkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMDAeFw0yNDA3MjUxODMxMThaFw0yNTEwMjIxODMx
// SIG // MThaMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
// SIG // EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExp
// SIG // bWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo0
// SIG // MDFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgU2VydmljZTCCAiIwDQYJKoZIhvcN
// SIG // AQEBBQADggIPADCCAgoCggIBALy8IRcVpagON6JbBODw
// SIG // noGeJkn7B9mE0ihGL/Bp99+tgZmsnHX+U97UMaT9zVpu
// SIG // tmB1IniEF8PtLuKpWsuADdyKJyPuOzaYvX6OdsXQFzF9
// SIG // KRq3NHqlvEVjd2381zyr9OztfIth4w8i7ssGMigPRZlm
// SIG // 3j42oX/TMHfEIMoJD7cA61UBi8jpMjN1U4hyqoRrvQQh
// SIG // lUXR1vZZjzK61JT1omFfS1QgeVWHfgBFLXX6gHapc1cQ
// SIG // OdxIMUqoaeiW3xCp03XHz+k/DIq9B68E07VdodsgwbY1
// SIG // 20CGqsnCjm+t9xn0ZJ9teizgwYN+z/8cIaHV0/NWQtmh
// SIG // ze3sRA5pm4lrLIxrxSZJYtoOnbdNXkoTohpoW6J69Kl1
// SIG // 3AXqjW+kKBfI1/7g1bWPaby+I/GhFkuPYSlB9Js7ArnC
// SIG // K8FEvsfDLk9Ln+1VwhTRW4glDUU6H8SdweOeHhiYS9H8
// SIG // FE0W4Mgm6S4CjCg4gkbm+uQ4Wng71AACU/dykgqHhQqJ
// SIG // JT2r24EMmoRmQy/71gFY1+W/Cc4ZcvYBgnSv6ouovnMW
// SIG // dEvMegdsoz22X3QVXx/zQaf9S5+8W3jhEwDp+zk/Q91B
// SIG // rdKvioloGONh5y48oZdWwLuR34K8gDtwwmiHVdrY75CW
// SIG // stqjpxew4I/GutCkE/UIHyX8F5692Som2DI2lGwjSA58
// SIG // c9spAgMBAAGjggFJMIIBRTAdBgNVHQ4EFgQUb857ifUl
// SIG // NoOZf+f2/uQgYm2xxd0wHwYDVR0jBBgwFoAUn6cVXQBe
// SIG // Yl2D9OXSZacbUzUZ6XIwXwYDVR0fBFgwVjBUoFKgUIZO
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9j
// SIG // cmwvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUy
// SIG // MDIwMTAoMSkuY3JsMGwGCCsGAQUFBwEBBGAwXjBcBggr
// SIG // BgEFBQcwAoZQaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jZXJ0cy9NaWNyb3NvZnQlMjBUaW1lLVN0
// SIG // YW1wJTIwUENBJTIwMjAxMCgxKS5jcnQwDAYDVR0TAQH/
// SIG // BAIwADAWBgNVHSUBAf8EDDAKBggrBgEFBQcDCDAOBgNV
// SIG // HQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQELBQADggIBAIk+
// SIG // DVLztpcPtHQzLbAbsZl9qN5VUKp0JLiEwBiBgoCPrJe2
// SIG // amTkw3fC6sbB+Blgj087XN7a/AIAb7GCM1oxcIqAowkD
// SIG // g6taATFjcxLCs3JB8QM2KOUs3uzj5DANwwMVauEkkfMv
// SIG // k0QthnDndCUXmdZT5YZT5fVyPs/DoLTj5kJyy4j/as6U
// SIG // x8Bc3vrG6kp/HHpHbjGXS8hyZNzYsNwJ4JVP1k8xrEAH
// SIG // XIfUlVeCx4n1J5sE39ItO4irU5TZKt28dYsloOze4xmQ
// SIG // AUVk9pl/mAFR5Stu7fZ/lrWG5+nDiTV+i7B/MT1QUWAC
// SIG // EVZFrDMhAHaD/Xan2mc8Fxpo7lUPd9TYcx44xvhH8Ndf
// SIG // A145N1at6lCNa3t+MzDE0c2WRMPNhbqRd74lzUdw1TpU
// SIG // vSR+MeXpnyDWtbrkmnOheAniQg9RmpH0uw+WsjbGmdnv
// SIG // rAVIetilU5YRLEER2UcAk8W4sdWOIicPjwzS3NB39fal
// SIG // 9l4l9LtkjPQlk047M/UrwoyCksQmRQjb/86SiJbB8e4U
// SIG // DUB0jGyodP8MJ/OroiACxI2s1LMxNPl+q3Dmw31OIfzv
// SIG // 9L5mxdwTEfuOawGTABEybEQz8RyQqP+VxoVnYPy6CeV1
// SIG // gazgy+OGDazexUZxxAAK9OrH5amfHnldxbgynT+YdfVl
// SIG // JxlsDtR/2Y1MzqFRold4MIIHcTCCBVmgAwIBAgITMwAA
// SIG // ABXF52ueAptJmQAAAAAAFTANBgkqhkiG9w0BAQsFADCB
// SIG // iDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWlj
// SIG // cm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5
// SIG // IDIwMTAwHhcNMjEwOTMwMTgyMjI1WhcNMzAwOTMwMTgz
// SIG // MjI1WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQD
// SIG // Ex1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDCC
// SIG // AiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAOTh
// SIG // pkzntHIhC3miy9ckeb0O1YLT/e6cBwfSqWxOdcjKNVf2
// SIG // AX9sSuDivbk+F2Az/1xPx2b3lVNxWuJ+Slr+uDZnhUYj
// SIG // DLWNE893MsAQGOhgfWpSg0S3po5GawcU88V29YZQ3MFE
// SIG // yHFcUTE3oAo4bo3t1w/YJlN8OWECesSq/XJprx2rrPY2
// SIG // vjUmZNqYO7oaezOtgFt+jBAcnVL+tuhiJdxqD89d9P6O
// SIG // U8/W7IVWTe/dvI2k45GPsjksUZzpcGkNyjYtcI4xyDUo
// SIG // veO0hyTD4MmPfrVUj9z6BVWYbWg7mka97aSueik3rMvr
// SIG // g0XnRm7KMtXAhjBcTyziYrLNueKNiOSWrAFKu75xqRdb
// SIG // Z2De+JKRHh09/SDPc31BmkZ1zcRfNN0Sidb9pSB9fvzZ
// SIG // nkXftnIv231fgLrbqn427DZM9ituqBJR6L8FA6PRc6ZN
// SIG // N3SUHDSCD/AQ8rdHGO2n6Jl8P0zbr17C89XYcz1DTsEz
// SIG // OUyOArxCaC4Q6oRRRuLRvWoYWmEBc8pnol7XKHYC4jMY
// SIG // ctenIPDC+hIK12NvDMk2ZItboKaDIV1fMHSRlJTYuVD5
// SIG // C4lh8zYGNRiER9vcG9H9stQcxWv2XFJRXRLbJbqvUAV6
// SIG // bMURHXLvjflSxIUXk8A8FdsaN8cIFRg/eKtFtvUeh17a
// SIG // j54WcmnGrnu3tz5q4i6tAgMBAAGjggHdMIIB2TASBgkr
// SIG // BgEEAYI3FQEEBQIDAQABMCMGCSsGAQQBgjcVAgQWBBQq
// SIG // p1L+ZMSavoKRPEY1Kc8Q/y8E7jAdBgNVHQ4EFgQUn6cV
// SIG // XQBeYl2D9OXSZacbUzUZ6XIwXAYDVR0gBFUwUzBRBgwr
// SIG // BgEEAYI3TIN9AQEwQTA/BggrBgEFBQcCARYzaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9Eb2NzL1Jl
// SIG // cG9zaXRvcnkuaHRtMBMGA1UdJQQMMAoGCCsGAQUFBwMI
// SIG // MBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1Ud
// SIG // DwQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQY
// SIG // MBaAFNX2VsuP6KJcYmjRPZSQW9fOmhjEMFYGA1UdHwRP
// SIG // ME0wS6BJoEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY3JsL3Byb2R1Y3RzL01pY1Jvb0NlckF1dF8y
// SIG // MDEwLTA2LTIzLmNybDBaBggrBgEFBQcBAQROMEwwSgYI
// SIG // KwYBBQUHMAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYt
// SIG // MjMuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQCdVX38Kq3h
// SIG // LB9nATEkW+Geckv8qW/qXBS2Pk5HZHixBpOXPTEztTnX
// SIG // wnE2P9pkbHzQdTltuw8x5MKP+2zRoZQYIu7pZmc6U03d
// SIG // mLq2HnjYNi6cqYJWAAOwBb6J6Gngugnue99qb74py27Y
// SIG // P0h1AdkY3m2CDPVtI1TkeFN1JFe53Z/zjj3G82jfZfak
// SIG // Vqr3lbYoVSfQJL1AoL8ZthISEV09J+BAljis9/kpicO8
// SIG // F7BUhUKz/AyeixmJ5/ALaoHCgRlCGVJ1ijbCHcNhcy4s
// SIG // a3tuPywJeBTpkbKpW99Jo3QMvOyRgNI95ko+ZjtPu4b6
// SIG // MhrZlvSP9pEB9s7GdP32THJvEKt1MMU0sHrYUP4KWN1A
// SIG // PMdUbZ1jdEgssU5HLcEUBHG/ZPkkvnNtyo4JvbMBV0lU
// SIG // ZNlz138eW0QBjloZkWsNn6Qo3GcZKCS6OEuabvshVGtq
// SIG // RRFHqfG3rsjoiV5PndLQTHa1V1QJsWkBRH58oWFsc/4K
// SIG // u+xBZj1p/cvBQUl+fpO+y/g75LcVv7TOPqUxUYS8vwLB
// SIG // gqJ7Fx0ViY1w/ue10CgaiQuPNtq6TPmb/wrpNPgkNWcr
// SIG // 4A245oyZ1uEi6vAnQj0llOZ0dFtq0Z4+7X6gMTN9vMvp
// SIG // e784cETRkPHIqzqKOghif9lwY1NNje6CbaUFEMFxBmoQ
// SIG // tB1VM1izoXBm8qGCA1YwggI+AgEBMIIBAaGB2aSB1jCB
// SIG // 0zELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWlj
// SIG // cm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVk
// SIG // MScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046NDAxQS0w
// SIG // NUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFNlcnZpY2WiIwoBATAHBgUrDgMCGgMVAIRj
// SIG // Rw/2u0NG0C1lRvSbhsYC0V7HoIGDMIGApH4wfDELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgUENBIDIwMTAwDQYJKoZIhvcNAQEL
// SIG // BQACBQDrunsZMCIYDzIwMjUwNDI4MjIwOTI5WhgPMjAy
// SIG // NTA0MjkyMjA5MjlaMHQwOgYKKwYBBAGEWQoEATEsMCow
// SIG // CgIFAOu6exkCAQAwBwIBAAICI6IwBwIBAAICFI4wCgIF
// SIG // AOu7zJkCAQAwNgYKKwYBBAGEWQoEAjEoMCYwDAYKKwYB
// SIG // BAGEWQoDAqAKMAgCAQACAwehIKEKMAgCAQACAwGGoDAN
// SIG // BgkqhkiG9w0BAQsFAAOCAQEAp9FLNlzbYtEG3F4zyWz3
// SIG // O4DAhj8kvn+5WrrPImPRw7azcEfGXVqbWLro85EmrxU3
// SIG // PL77X4XS/XMzef4K9qWzhSpGO0rZjm6btnQ/oSjxA5qZ
// SIG // 4+FA6thTXjnRzDWzEZK57xdXWtq8ORr1LUeD8gqJaoYU
// SIG // A5CqtrVB5+mQaU3T52h7MZt0vb0u7747KdUHpw1uEjSC
// SIG // yGZeyNtmLfBHTNOVUrFgVRvKmwYlH+lgerEBwhrNokQB
// SIG // hWKTxWpfXlZ3G0dvp8i/76k9NfBmSzeV/HFNtismnjA1
// SIG // r3JvPgTlTUyWT6sLWM87dfbsmSRERt3AdwZW6kb4dHdC
// SIG // 7wLzw/D8/bUJjDGCBA0wggQJAgEBMIGTMHwxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBU
// SIG // aW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB/tCowns0IQsB
// SIG // AAEAAAH+MA0GCWCGSAFlAwQCAQUAoIIBSjAaBgkqhkiG
// SIG // 9w0BCQMxDQYLKoZIhvcNAQkQAQQwLwYJKoZIhvcNAQkE
// SIG // MSIEIBprLip2CV+Sml+uReaLUjGzya2v3u1WqSmHZCkW
// SIG // ZgviMIH6BgsqhkiG9w0BCRACLzGB6jCB5zCB5DCBvQQg
// SIG // EYXM3fxTyJ8Y0fdptoT1qnPrxjhtfvyNFrZArLcodHkw
// SIG // gZgwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYD
// SIG // VQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAx
// SIG // MAITMwAAAf7QqMJ7NCELAQABAAAB/jAiBCBcb7ldg4ft
// SIG // DF5M7Ig2lr3NvLNBsV110ntYMb+kmtRRXDANBgkqhkiG
// SIG // 9w0BAQsFAASCAgBfkGvpmOxUX6FU96XHJ1vMyAGhBf18
// SIG // ehZzHTzuy/CGrkRF2oTzwU6Jta5l47hri/PYaWa0qBb9
// SIG // mmIV/DsJfNCcA0hp9QXOrtS2T52MrIf0UKZcCzeyS7AW
// SIG // tDE1Xvh7h4MAuLduNa27FxLrWk/lTtjKJNPhubf4m6U0
// SIG // T6Hp8ifnhyl/s8SZXN9U79wHkISX8Xv1BgMN1DZn5dFq
// SIG // e4BdBefNCtFQ+K6RMSFRr18o1RBjk0IIlwkLKh8EbEuQ
// SIG // HE60yHG8c2DMGaj3AMHHljHbnxXT7ReNcDGBD7ceRmJS
// SIG // nlnvrBVewrQSqNzrj1IkmwMxykzgASu74cua6udaNZ2/
// SIG // 2DVobJwnx1ULq1WMIeT8PasCOwZjdVnTPt1KXMPKjtyL
// SIG // VhqNSKLmINLJ5vsbL/dYwaBOZRbLZ8xRaLLDysOvvg3t
// SIG // 0NXyGZ+WlfXl8DNjYo1t+8vl0OorPJCB1IgVQf+jf0SO
// SIG // EN7eKimgHtdl4J0mdBbi2o/fw8JSfWa5p3sclnHc50QP
// SIG // gUtkndf1SQr80M/oR+n+6k0YOE9u8AfRq5XbVHzK9xVv
// SIG // IJxV30BsMF9AeZY8UqZy4xM4YwKIBYLvO9QkOL6C0tRy
// SIG // 2QXHCbDJ1aB2Ekel7qwOOYkZMvFopxqc2XKShYRWUXlc
// SIG // kQ0HU5sO8u2q6TAeP3AAjCPewwKLJ5QwG6VSIA==
// SIG // End signature block
