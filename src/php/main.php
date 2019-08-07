<?php
  abstract class Query{
    private static $args;
    protected $date;

    protected function __construct(){
      $this->date = (int)(microtime(true) * 1e3);
      $this->query($this->getPDO(), Query::$args);
    }

    public static function init(){
      $stdin = fopen('php://stdin', 'r');
      $str = fgets($stdin);
      fclose($stdin);

      $params = json_decode($str);
      $file = 'queries/' . $params->query . '.php';
      Query::$args = $params->args;

      include_once($file);
    }

    private static function getPDO(){
      $host = 'localhost';
      $user = 'root';
      $pass = '';
      $dbName = 'psi-projekat';

      $pdo = new PDO('mysql:host=' . $host . ';dbname=' . $dbName, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_STRINGIFY_FETCHES => false,
      ]);

      return $pdo;
    }

    protected function succ($data=null){
      $this->send(['data' => $data, 'error' => null]);
    }

    protected function err($err){
      $this->send(['data' => null, 'error' => $err]);
    }

    private function send($str){
      printf("%s", json_encode($str));
    }

    abstract protected function query($pdo, $args);
  }

  Query::init();
?>