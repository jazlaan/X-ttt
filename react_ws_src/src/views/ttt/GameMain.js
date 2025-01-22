import React, {Component} from 'react'

import io from 'socket.io-client'

import TweenMax from 'gsap'

import rand_arr_elem from '../../helpers/rand_arr_elem'
import rand_to_fro from '../../helpers/rand_to_fro'

export default class SetName extends Component {

	constructor (props) {
		super(props)

		// this.win_sets = [
		// 	['c1', 'c2', 'c3'],
		// 	['c4', 'c5', 'c6'],
		// 	['c7', 'c8', 'c9'],

		// 	['c1', 'c4', 'c7'],
		// 	['c2', 'c5', 'c8'],
		// 	['c3', 'c6', 'c9'],

		// 	['c1', 'c5', 'c9'],
		// 	['c3', 'c5', 'c7']
		// ]
		this.win_sets = this.win_sets_by_board_size(this.props.board_size)


		if (this.props.game_type != 'live')
			this.state = {
				cell_vals: {},
				next_turn_ply: true,
				game_play: true,
				game_stat: 'Start game'
			}
		else {
			this.sock_start()

			this.state = {
				cell_vals: {},
				next_turn_ply: true,
				game_play: false,
				game_stat: 'Connecting'
			}
		}
	}

//	------------------------	------------------------	------------------------

		win_sets_by_board_size(size) {
		let sets = []
		
		// rows
		for(let i = 0; i < size; i++) {
			let row = []
			for(let j = 0; j < size; j++) {
				row.push(`c${i * size + j + 1}`)
			}
			sets.push(row)
		}
		
		// columns 
		for(let i = 0; i < size; i++) {
			let col = []
			for(let j = 0; j < size; j++) {
				col.push(`c${j * size + i + 1}`)
			}
			sets.push(col)
		}
		
		// diagonals
		for(let i = 0; i <= size - size; i++) {
			for(let j = 0; j <= size - size; j++) {				let diag = []
				let antiDiag = []
				for(let k = 0; k < size; k++) {
					if(i + k < size && j + k < size) {
						diag.push(`c${(i + k) * size + (j + k) + 1}`)
						if(j + size - 1 - k >= 0) {
							antiDiag.push(`c${(i + k) * size + (j + size - 1 - k) + 1}`)
						}
					}
				}
				if(diag.length === size) sets.push(diag)
				if(antiDiag.length === size) sets.push(antiDiag)
			}
		}
		
		return sets
	}
	
	
//	------------------------	------------------------	------------------------

	componentDidMount () {
    	TweenMax.from('#game_stat', 1, {display: 'none', opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeIn})
    	TweenMax.from('#game_board', 1, {display: 'none', opacity: 0, x:-200, y:-200, scaleX:0, scaleY:0, ease: Power4.easeIn})
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	sock_start () {

		this.socket = io(app.settings.ws_conf.loc.SOCKET__io.u);

		this.socket.on('connect', function(data) { 
			// console.log('socket connected', data)

			this.socket.emit('new player', { name: app.settings.curr_user.name });

		}.bind(this));

		this.socket.on('pair_players', function(data) { 
			// console.log('paired with ', data)

			this.setState({
				next_turn_ply: data.mode=='m',
				game_play: true,
				game_stat: 'Playing with ' + data.opp.name
			})

		}.bind(this));


		this.socket.on('opp_turn', this.turn_opp_live.bind(this));



	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	componentWillUnmount () {

		this.socket && this.socket.disconnect();
	}

//	------------------------	------------------------	------------------------

	cell_cont (c) {
		const { cell_vals } = this.state

		return (<div>
		        	{cell_vals && cell_vals[c]=='x' && <i className="fa fa-times fa-5x"></i>}
					{cell_vals && cell_vals[c]=='o' && <i className="fa fa-circle-o fa-5x"></i>}
				</div>)
	}

//	------------------------	------------------------	------------------------

	render () {
		const { cell_vals } = this.state
		const size = this.props.board_size
		
		let variable_rows = []
		for(let i = 0; i < size; i++) {
			let cells = []
			for(let j = 0; j < size; j++) {
				const cellId = `c${i * size + j + 1}`
				cells.push(
					<td 
						key={cellId}
						id={`game_board-${cellId}`} 
						ref={cellId}
						onClick={this.click_cell.bind(this)}
						className={`${j > 0 && j < size-1 ? 'vbrd' : ''} ${i > 0 && i < size-1 ? 'hbrd' : ''}`}
					>
						{this.cell_cont(cellId)}
					</td>
				)
			}
			variable_rows.push(<tr key={i}>{cells}</tr>)
		}

		return (
			<div id='GameMain'>

				<h1>Play {this.props.game_type}</h1>

				<div id="game_stat">
					<div id="game_stat_msg">{this.state.game_stat}</div>
					{this.state.game_play && <div id="game_turn_msg">{this.state.next_turn_ply ? 'Your turn' : 'Opponent turn'}</div>}
				</div>

				<div id="game_board">
					<table>
						<tbody>
							{variable_rows}
						</tbody>
					</table>
				</div>

				<button type='submit' onClick={this.end_game.bind(this)} className='button'><span>End Game <span className='fa fa-caret-right'></span></span></button>

			</div>
		)
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	click_cell (e) {
		// console.log(e.currentTarget.id.substr(11))
		// console.log(e.currentTarget)
		
		if (!this.state.next_turn_ply || !this.state.game_play) return

		//const cell_id = e.currentTarget.id.substr(11)
		const cell_id = e.target.getAttribute('ref') || e.target.id.split('-')[1]
		
		if (this.state.cell_vals[cell_id]) return

		if (this.props.game_type != 'live')
			this.turn_ply_comp(cell_id)
		else
			this.turn_ply_live(cell_id)
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	turn_ply_comp (cell_id) {

		let { cell_vals } = this.state

		cell_vals[cell_id] = 'x'

		TweenMax.from(this.refs[cell_id], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})

		this.setState({
			cell_vals: cell_vals,
			next_turn_ply: false
		}, () => {
			this.check_turn()
		})

		// setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));
		// this.state.cell_vals = cell_vals


	}

//	------------------------	------------------------	------------------------

	turn_comp () {

		let { cell_vals } = this.state
		let empty_cells_arr = []

		const size = this.props.board_size
		const totalCells = size * size

		// get empty cells
		for (let i = 1; i <= totalCells; i++) {
			const cell = 'c' + i
			if (!cell_vals[cell]) {
				empty_cells_arr.push(cell)
			}
		}

		if (empty_cells_arr.length > 0) {
			// const c = this.find_unbeatable_movie(cell_vals)
			const c = empty_cells_arr[Math.floor(Math.random() * empty_cells_arr.length)]
			cell_vals[c] = 'o'

			TweenMax.from(this.refs[c], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})

			// this.state.cell_vals = cell_vals
			
			this.setState({
				cell_vals: cell_vals,
				next_turn_ply: true
			}, () => {
				this.check_turn()
			})
		}
	}

	find_unbeatable_movie(board) {
		let bestScore = -Infinity
		let bestMove = null
		
		// Try each available move
		for (let i = 1; i <= 9; i++) {
			const cell = 'c' + i
			if (!board[cell]) {
				// Make the move
				board[cell] = 'o'
				// Get score from minimax
				const score = this.minimax(board, 0, false)
				// Undo the move
				board[cell] = null
				
				// Update best move if better score found
				if (score > bestScore) {
					bestScore = score
					bestMove = cell
				}
			}
		}
		
		return bestMove
	}
	
	minimax(board, depth, isMaximizing) {
		const result = this.check_winner(board)
		if (result !== null) {
			return result === 'o' ? 10 - depth : depth - 10
		}
		if (this.is_board_full(board)) {
			return 0
		}
		
		if (isMaximizing) {
			let bestScore = -Infinity
			for (let i = 1; i <= 9; i++) {
				const cell = 'c' + i
				if (!board[cell]) {
					board[cell] = 'o'
					const score = this.minimax(board, depth + 1, false)
					board[cell] = null
					bestScore = Math.max(score, bestScore)
				}
			}
			return bestScore
		} else {
			let bestScore = Infinity
			for (let i = 1; i <= 9; i++) {
				const cell = 'c' + i
				if (!board[cell]) {
					board[cell] = 'x'
					const score = this.minimax(board, depth + 1, true)
					board[cell] = null
					bestScore = Math.min(score, bestScore)
				}
			}
			return bestScore
		}
	}
	
	check_winner(board) {
		const size = this.props.board_size
		// Check all possible winning combinations on new sets
		for (const set of this.win_sets) {
			if (board[set[0]]) {
				let count = 1
				for (let i = 1; i < set.length; i++) {
					if (board[set[0]] === board[set[i]]) {
						count++
					} else {
						break
					}
				}
				if (count === size) {
					// winning cells
					set.forEach(cellId => {
						if (this.refs[cellId]) {
							this.refs[cellId].classList.add('win')
						}
					})
					return board[set[0]]
				}
			}
		}
		return null
	}
	
	is_board_full(board) {
		const size = this.props.board_size
		const totalCells = size * size
		
		for (let i = 1; i <= totalCells; i++) {
			if (!board['c' + i]) {
				return false
			}
		}
		return true
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	turn_ply_live (cell_id) {

		let { cell_vals } = this.state

		cell_vals[cell_id] = 'x'

		TweenMax.from(this.refs[cell_id], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})

		this.socket.emit('ply_turn', { cell_id: cell_id });
		
		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: false
		// })

		// setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

		this.state.cell_vals = cell_vals

		this.check_turn()
	}

//	------------------------	------------------------	------------------------

	turn_opp_live (data) {

		let { cell_vals } = this.state
		let empty_cells_arr = []


		const c = data.cell_id
		cell_vals[c] = 'o'

		TweenMax.from(this.refs[c], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})
		

		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: true
		// })

		this.state.cell_vals = cell_vals

		this.check_turn()
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	check_turn () {
		const winner = this.check_winner(this.state.cell_vals)
		
		if (winner) {
			this.refs[set[0]].classList.add('win')
			this.refs[set[1]].classList.add('win')
			this.refs[set[2]].classList.add('win')

			TweenMax.killAll(true)
			TweenMax.from('td.win', 1, {opacity: 0, ease: Linear.easeIn})


			this.setState({
				game_stat: winner === 'x' ? 'You Won!' : 'Computer Won!',
				game_play: false,
				next_turn_ply: false
			})

			this.socket && this.socket.disconnect();
		} else if (this.is_board_full(this.state.cell_vals)) {
			this.setState({
				game_stat: 'Draw!',
				game_play: false,
				next_turn_ply: false
			})
			
			this.socket && this.socket.disconnect();

		} else if (!this.state.next_turn_ply) {
			// delay for comp move
			setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000))
		}
	}

//	------------------------	------------------------	------------------------

	end_game () {
		this.socket && this.socket.disconnect();

		this.props.onEndGame()
	}



}
