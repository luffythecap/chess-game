import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Bot, Crown, Trophy, RotateCcw, Settings } from 'lucide-react';
import './App.css';

// Chess piece components
const ChessBoard = ({ game, gameMode, onMove, selectedSquare, onSquareClick, gameState, moveHistory }) => {
  const board = game.board();
  
  const renderSquare = (square, piece, rowIndex, colIndex) => {
    const isLight = (rowIndex + colIndex) % 2 === 0;
    const squareNotation = String.fromCharCode(97 + colIndex) + (8 - rowIndex);
    const isSelected = selectedSquare === squareNotation;
    const isValidMove = game.moves({ square: selectedSquare, verbose: true })
      .some(move => move.to === squareNotation);
    const isInCheck = piece && piece.type === 'k' && game.inCheck() && 
                     ((piece.color === 'w' && game.turn() === 'w') || 
                      (piece.color === 'b' && game.turn() === 'b'));
    
    return (
      <motion.div
        key={squareNotation}
        className={`
          chess-square
          ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
          ${isSelected ? 'ring-4 ring-blue-500' : ''}
          ${isValidMove ? 'after:absolute after:inset-0 after:bg-green-400 after:opacity-30 after:rounded-full after:m-4' : ''}
          ${isInCheck ? 'bg-red-500' : ''}
          relative w-16 h-16 flex items-center justify-center cursor-pointer
          hover:opacity-80 transition-all duration-200
        `}
        onClick={() => onSquareClick(squareNotation)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {piece && (
          <motion.div
            className="text-4xl select-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {getPieceSymbol(piece)}
          </motion.div>
        )}
        <div className="absolute bottom-0 right-1 text-xs text-gray-600">
          {squareNotation}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="chess-board grid grid-cols-8 gap-0 border-4 border-amber-900 rounded-lg overflow-hidden shadow-2xl">
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => renderSquare(piece, piece, rowIndex, colIndex))
      )}
    </div>
  );
};

const getPieceSymbol = (piece) => {
  const symbols = {
    'k': piece.color === 'w' ? '♔' : '♚',
    'q': piece.color === 'w' ? '♕' : '♛', 
    'r': piece.color === 'w' ? '♖' : '♜',
    'b': piece.color === 'w' ? '♗' : '♝',
    'n': piece.color === 'w' ? '♘' : '♞',
    'p': piece.color === 'w' ? '♙' : '♟'
  };
  return symbols[piece.type] || '';
};

const GameInfo = ({ game, gameState, currentPlayer, timeLeft, gameMode, onNewGame, onUndo }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-info bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Crown className="text-yellow-600" />
          Chess Master
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onNewGame}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={onUndo}
            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={game.history().length === 0}
          >
            ↶
          </button>
        </div>
      </div>

      <div className="game-mode flex items-center gap-2 text-lg">
        {gameMode === 'multiplayer' ? <Users className="text-blue-500" /> : <Bot className="text-green-500" />}
        <span className="font-semibold">
          {gameMode === 'multiplayer' ? 'Multiplayer' : 'vs Computer'}
        </span>
      </div>

      <div className="current-turn">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">Current Turn:</span>
          <div className={`px-3 py-1 rounded-full text-white font-bold ${
            currentPlayer === 'white' ? 'bg-gray-300 text-black' : 'bg-gray-800'
          }`}>
            {currentPlayer === 'white' ? '⚪ White' : '⚫ Black'}
          </div>
        </div>
        
        <div className="timer flex items-center gap-2">
          <Clock className="text-red-500" />
          <span className="text-xl font-mono">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="game-status">
        {gameState.gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg"
          >
            <Trophy className="mx-auto mb-2" size={32} />
            <div className="text-xl font-bold">
              {gameState.winner ? `${gameState.winner} Wins!` : 'Draw!'}
            </div>
            <div className="text-sm mt-1">{gameState.reason}</div>
          </motion.div>
        )}
        
        {game.inCheck() && !gameState.gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-2 bg-red-500 text-white rounded-lg font-bold"
          >
            CHECK!
          </motion.div>
        )}
      </div>
    </div>
  );
};

const MoveHistory = ({ moveHistory }) => {
  return (
    <div className="move-history bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold mb-3 text-gray-800">Move History</h3>
      <div className="max-h-64 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {moveHistory.map((move, index) => (
            <div key={index} className={`p-2 rounded ${index % 4 < 2 ? 'bg-gray-100' : 'bg-gray-50'}`}>
              <span className="font-mono">{Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GameModeSelector = ({ gameMode, setGameMode, onNewGame }) => {
  return (
    <div className="game-mode-selector bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Game Mode</h3>
      <div className="flex gap-4">
        <button
          onClick={() => {
            setGameMode('multiplayer');
            onNewGame();
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
            gameMode === 'multiplayer' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Users size={20} />
          Multiplayer
        </button>
        <button
          onClick={() => {
            setGameMode('computer');
            onNewGame();
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
            gameMode === 'computer' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Bot size={20} />
          vs Computer
        </button>
      </div>
    </div>
  );
};

function App() {
  const [game, setGame] = useState(new Chess());
  const [gameMode, setGameMode] = useState('multiplayer');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [gameState, setGameState] = useState({ gameOver: false, winner: null, reason: null });
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes per player
  const [playerTime, setPlayerTime] = useState({ white: 600, black: 600 });

  // Timer functionality
  useEffect(() => {
    if (!gameState.gameOver) {
      const timer = setInterval(() => {
        setPlayerTime(prev => {
          const newTime = { ...prev };
          const currentTurn = game.turn() === 'w' ? 'white' : 'black';
          newTime[currentTurn] = Math.max(0, newTime[currentTurn] - 1);
          
          if (newTime[currentTurn] === 0) {
            setGameState({
              gameOver: true,
              winner: currentTurn === 'white' ? 'Black' : 'White',
              reason: 'Time out'
            });
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [game, gameState.gameOver]);

  // Update current time display
  useEffect(() => {
    const currentTurn = game.turn() === 'w' ? 'white' : 'black';
    setTimeLeft(playerTime[currentTurn]);
  }, [playerTime, game]);

  // Computer AI move
  const makeComputerMove = useCallback(() => {
    if (gameMode === 'computer' && game.turn() === 'b' && !gameState.gameOver) {
      setTimeout(() => {
        const possibleMoves = game.moves();
        if (possibleMoves.length > 0) {
          const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          const newGame = new Chess(game.fen());
          const move = newGame.move(randomMove);
          
          if (move) {
            setGame(newGame);
            setMoveHistory(prev => [...prev, move.san]);
            setCurrentPlayer(newGame.turn() === 'w' ? 'white' : 'black');
            checkGameState(newGame);
          }
        }
      }, 1000);
    }
  }, [game, gameMode, gameState.gameOver]);

  useEffect(() => {
    makeComputerMove();
  }, [makeComputerMove]);

  const checkGameState = (currentGame) => {
    if (currentGame.isGameOver()) {
      let winner = null;
      let reason = '';
      
      if (currentGame.isCheckmate()) {
        winner = currentGame.turn() === 'w' ? 'Black' : 'White';
        reason = 'Checkmate';
      } else if (currentGame.isStalemate()) {
        reason = 'Stalemate';
      } else if (currentGame.isDraw()) {
        reason = 'Draw';
      }
      
      setGameState({ gameOver: true, winner, reason });
    }
  };

  const handleSquareClick = (square) => {
    if (gameState.gameOver) return;
    if (gameMode === 'computer' && game.turn() === 'b') return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (selectedSquare) {
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q' // Auto-promote to queen
      };

      const newGame = new Chess(game.fen());
      const result = newGame.move(move);

      if (result) {
        setGame(newGame);
        setMoveHistory(prev => [...prev, result.san]);
        setCurrentPlayer(newGame.turn() === 'w' ? 'white' : 'black');
        checkGameState(newGame);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(square);
      }
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  };

  const handleNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setGameState({ gameOver: false, winner: null, reason: null });
    setMoveHistory([]);
    setCurrentPlayer('white');
    setPlayerTime({ white: 600, black: 600 });
  };

  const handleUndo = () => {
    if (game.history().length > 0) {
      const newGame = new Chess();
      const history = game.history();
      
      // Replay all moves except the last one
      for (let i = 0; i < history.length - 1; i++) {
        newGame.move(history[i]);
      }
      
      setGame(newGame);
      setMoveHistory(prev => prev.slice(0, -1));
      setCurrentPlayer(newGame.turn() === 'w' ? 'white' : 'black');
      setGameState({ gameOver: false, winner: null, reason: null });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <motion.h1 
              className="text-5xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              ♛ Chess Master ♛
            </motion.h1>
            <motion.p 
              className="text-xl text-blue-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              The Ultimate Chess Experience
            </motion.p>
          </header>

          <GameModeSelector 
            gameMode={gameMode} 
            setGameMode={setGameMode} 
            onNewGame={handleNewGame}
          />

          <div className="game-container grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <ChessBoard
                  game={game}
                  gameMode={gameMode}
                  selectedSquare={selectedSquare}
                  onSquareClick={handleSquareClick}
                  gameState={gameState}
                  moveHistory={moveHistory}
                />
              </motion.div>
            </div>

            <div className="space-y-6">
              <GameInfo
                game={game}
                gameState={gameState}
                currentPlayer={currentPlayer}
                timeLeft={timeLeft}
                gameMode={gameMode}
                onNewGame={handleNewGame}
                onUndo={handleUndo}
              />
              
              <MoveHistory moveHistory={moveHistory} />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {gameState.gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="bg-white rounded-2xl p-8 text-center shadow-2xl"
              >
                <Trophy className="mx-auto mb-4 text-yellow-500" size={64} />
                <h2 className="text-3xl font-bold mb-2">
                  {gameState.winner ? `${gameState.winner} Wins!` : 'Game Over!'}
                </h2>
                <p className="text-xl text-gray-600 mb-6">{gameState.reason}</p>
                <button
                  onClick={handleNewGame}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                >
                  New Game
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}

export default App;