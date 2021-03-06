var React = require('react');
var ReactDOM = require('react-dom');

/*
 * A regular HTML table.
 * `cols` attribute is an array of {key, title} objects.
 * `data` attribute is an array of data objects with
 * fields mentioned in `cols`.
 */
export default class Table extends React.Component {
	render() {
		var cols = this.props.cols;
		var data = this.props.data;
		
		return (<table className={this.props.className}>
			<thead><tr>
				{cols.map(c => <th key={c.key}>{c.title}</th>)}
			</tr></thead>
			<tbody>{
				data.map((row, i) => <Row key={i} cols={cols} data={row} />)
			}</tbody>
			</table>);
	}
};

Table.defaultProps = {
	className: 'table table-bordered table-condensed'
};

class Row extends React.Component {
	render() {
		var data = this.props.data;
		return (
			<tr>{
				this.props.cols.map(function(r) {
					return <td key={r.key}>{data[r.key]}</td>;
				})
			}</tr>
		);
	}
};
