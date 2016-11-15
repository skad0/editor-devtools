import React from 'react';
import { connect } from 'react-redux';
import { sortBy } from 'lodash';
import { withState, mapProps, compose } from 'recompose';
import Divider from 'material-ui/Divider';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import AutoCompleteWithAction from '../components/AutoCompleteWithAction';
import ButtonWithPopup from '../components/ButtonWithPopup';
import Versions from '../components/Versions';
import * as actionCreators from '../store/actions/index';
import Impersonate from './Components/Impersonate';
import ActionItems from './Components/ActionItems';

const getBackgroundPage = () => {
  return new Promise(res => {
    chrome.runtime.getBackgroundPage(backgroundPage => {
      res(backgroundPage);
    });
  });
};

const applyOptions = {
  ALL: 'All',
  EXPERIMENTS: 'Experiments',
  VERSIONS: 'Versions',
  DEBUG: 'Debug',
  PLATFORM: 'Platform',
};

const applySettings = option => () => {
  getBackgroundPage()
    .then(backgroundPage => {
      backgroundPage.Utils.applySettings(option);
      window.close();
    });
};

const styles = {
  popup: { padding: 10 },
  divider: { marginTop: 10, marginBottom: 10 },
  impersonateImg: { height: 36, width: 36 },
  impersonate: { padding: 10, paddingBottom: 0, cursor: 'pointer', display: 'inline-block' },
  debugPackages: {
    autoComplete: { display: 'inline-block' },
  },
  settings: { width: 30, height: 30, cursor: 'pointer' },
  fixed: {
    position: 'fixed',
    right: 20,
    top: 20,
    width: 80,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  buttons: { display: 'flex', flexDirection: 'row' },
  button: { marginRight: 10 },
};

const getPackages = packages => {
  const getPackageItem = (project, pkg) => ({
    text: pkg,
    value: (
      <MenuItem
        style={{ margin: 10 }}
        primaryText={pkg}
        secondaryText={project}
      />
    ),
  });

  const allPackages = ['viewer', 'editor']
          .reduce((acc, project) => {
            return acc.concat(Object.keys(packages[project])
                    .filter(pkg => pkg !== 'all' && !packages[project][pkg])
                    .map(pkg => getPackageItem(project, pkg)));
          }, []);

  return sortBy(allPackages, 'text');
};

const getExperiments = experiments => {
  return []
    .concat(Object.keys(experiments.editor.on).filter(exp => !experiments.editor.on[exp]))
    .concat(Object.keys(experiments.viewer.on).filter(exp => !experiments.viewer.on[exp]))
    .sort();
};

const Popup = (props) => {
  return (
    <div style={styles.popup}>
      <div style={styles.fixed}>
        <img
          style={styles.settings}
          src={chrome.extension.getURL('assets/images/setting.png')}
          alt="Settings"
          title="Settings"
          onClick={() => getBackgroundPage().then(({ Utils }) => Utils.openOptionsPage())}
        />
        <Impersonate username={props.settings.username} />
      </div>
      <h3>Change Version</h3>
      <Versions flat />
      <Divider style={styles.divider} />
      <AutoCompleteWithAction
        floatingLabelText="Add Package to debug"
        dataSource={getPackages(props.packages)}
        onNewRequest={pkg => {
          props.setSelectedPackage(`${pkg.value.props.primaryText}_${pkg.value.props.secondaryText}`);
        }}
        onActionClicked={() => {
          const [pkg, project] = props.package.split('_');
          getBackgroundPage()
            .then(({ Utils }) => Utils.debugPackage(project, pkg));
          props.setPackage(project, pkg);
          applySettings(applyOptions.DEBUG);
        }}
      />
      <AutoCompleteWithAction
        floatingLabelText="Add Experiment"
        dataSource={getExperiments(props.experiments)}
        onNewRequest={exp => props.setSelectedExperiment(exp)}
        onActionClicked={() => getBackgroundPage().then(({ Utils }) => Utils.addExperiment(props.experiment))}
      />
      <Divider style={styles.divider} />
      <div style={styles.buttons}>
        <ButtonWithPopup label="Apply" onClick={applySettings(applyOptions.ALL)} style={styles.button}>
          <Menu>
            <MenuItem primaryText="Apply All" onTouchTap={applySettings(applyOptions.ALL)} />
            <MenuItem primaryText="Apply Experiments" onTouchTap={applySettings(applyOptions.EXPERIMENTS)} />
            <MenuItem primaryText="Apply Versions" onTouchTap={applySettings(applyOptions.VERSIONS)} />
            <MenuItem primaryText="Apply Debug" onTouchTap={applySettings(applyOptions.DEBUG)} />
            <MenuItem primaryText="Apply Platform" onTouchTap={applySettings(applyOptions.PLATFORM)} />
          </Menu>
        </ButtonWithPopup>
        <ActionItems buttonStyle={styles.button} settings={props.settings} />
      </div>
    </div>
  );
};

const { PropTypes } = React;
Popup.propTypes = {
  experiments: PropTypes.object.isRequired,
  packages: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  updateSettings: PropTypes.func.isRequired,

  // Actions
  setPackage: PropTypes.func.isRequired,

  // State
  experiment: PropTypes.string.isRequired,
  package: PropTypes.string.isRequired,

  // State Actions
  setSelectedExperiment: PropTypes.func.isRequired,
  setSelectedPackage: PropTypes.func.isRequired,
};

const mapStateToProps = ({ settings, packages, experiments }) => ({ settings, packages, experiments });

const enhance = compose(
  withState('experiment', 'setSelectedExperiment', ''),
  withState('package', 'setSelectedPackage', ''),
  mapProps(props => Object.assign(props, {
    settings: props.settings.toJS(),
    packages: props.packages.toJS(),
    experiments: props.experiments.toJS(),
  }))
);

export default connect(mapStateToProps, actionCreators)(enhance(Popup));
